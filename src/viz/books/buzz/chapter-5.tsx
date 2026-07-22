// Buzz — chapter 5: the paper trail.
// Trust at both ends of the relay. Front: NIP-42 AUTH (relay challenge →
// client signs a kind-22242 event → AuthState::Authenticated, ±60s
// tolerance; the AUTH event itself is never stored). Back: buzz-audit's
// tamper-evident log — an append-only chain where each entry's SHA-256
// covers its payload AND the previous hash, written under pg_advisory_lock
// (single writer). The chain here is computed with REAL SHA-256: tamper
// with entry 2 on screen and every later link recomputes differently.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { sha256Hex, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// A real hash chain (module scope). entry_hash = SHA-256(seq|action|prev).
// ---------------------------------------------------------------------------
interface Entry {
  seq: number;
  action: string;
  actor: string;
}
const ENTRIES: Entry[] = [
  { seq: 1, action: 'AuthSuccess', actor: 'maya' },
  { seq: 2, action: 'EventCreated', actor: 'maya' },
  { seq: 3, action: 'MemberAdded', actor: 'admin' },
  { seq: 4, action: 'EventCreated', actor: 'sam' },
  { seq: 5, action: 'MemberRemoved', actor: 'admin' },
];
const chainOf = (entries: Entry[]): string[] => {
  const out: string[] = [];
  let prev = '0'.repeat(64);
  for (const e of entries) {
    prev = sha256Hex(`${e.seq}|${e.action}|${e.actor}|${prev}`);
    out.push(prev);
  }
  return out;
};
const CHAIN = chainOf(ENTRIES);
// the tampered timeline: entry 2's action quietly edited
const TAMPERED_ENTRIES = ENTRIES.map((e) => (e.seq === 2 ? { ...e, action: 'EventDeleted' } : e));
const TAMPERED = chainOf(TAMPERED_ENTRIES);

// layout
const AUTH_Y = 170;
const CLIENT = { x: 220, y: AUTH_Y };
const RELAY = { x: 940, y: AUTH_Y };

const CARD_W = 196;
const CARD_H = 118;
const CARD_Y = 400;
const cardX = (i: number) => 120 + i * (CARD_W + 22);

const CAM_AUTH: CameraState = { x: 580, y: 210, k: 1.25 };
const CAM_CHAIN: CameraState = { x: 640, y: 440, k: 1.18 };
const CAM_TAMPER: CameraState = { x: 520, y: 440, k: 1.3 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const actorsU = tl.channel('actorsU', 0);
  const chalU = tl.channel('chalU', 0); // challenge travels relay → client
  const respU = tl.channel('respU', 0); // signed 22242 travels back
  const authedU = tl.channel('authedU', 0);
  const chainU = tl.channel('chainU', 0); // cards enter
  const linksU = tl.channel('linksU', 0); // hash links draw
  const tamperU = tl.channel('tamperU', 0); // entry 2 edit
  const cascadeU = tl.channel('cascadeU', 0); // recomputed hashes cascade red
  const lockU = tl.channel('lockU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the door needs a name.
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Two loose ends remain: how a connection proves who it is, and how anyone later proves what happened. Both are signatures — just pointed in different directions.',
  });
  tl.tween(actorsU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_AUTH, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(5.9, 0.7);

  // Beat 2 — NIP-42 challenge.
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'The moment you connect, the relay throws down a challenge string. Before any event or subscription is accepted, you must sign it — a kind twenty-two thousand two hundred forty-two event with the challenge inside.',
  });
  tl.tween(chalU, 1, { at: 7.4, dur: 1.6, ease: ease.linear });
  tl.tween(respU, 1, { at: 9.4, dur: 1.6, ease: ease.linear });
  tl.hold(12.4, 0.7);

  // Beat 3 — authenticated.
  tl.caption({
    at: 13.1,
    dur: 5.8,
    text: 'The relay checks the signature and the timestamp — sixty seconds of tolerance either way — and flips the connection to authenticated. The handshake event itself is never stored; it exists only to open the door.',
  });
  tl.tween(authedU, 1, { at: 14.0, dur: 0.9, ease: ease.pop });
  tl.hold(18.9, 0.7);

  // Beat 4 — the audit chain enters.
  tl.caption({
    at: 19.6,
    dur: 6.0,
    text: 'Now the other direction: the audit log. Every consequential act — a login, a message, a member added or removed — appends one entry. And each entry’s hash covers not just its own contents, but the hash of the entry before it.',
  });
  tl.tween(cam, CAM_CHAIN, { at: 19.8, dur: 1.5, ease: ease.move });
  tl.tween(chainU, 1, { at: 20.4, dur: 2.6, ease: ease.enter });
  tl.tween(linksU, 1, { at: 23.0, dur: 2.0, ease: ease.draw });
  tl.hold(25.9, 0.7);

  // Beat 5 — these are real hashes.
  tl.caption({
    at: 26.6,
    dur: 5.4,
    text: 'The hex under each card is a real hash of that entry, folded together with the previous link — computed live, right here. Which makes the chain a single object: history, holding hands with itself.',
  });
  tl.hold(32.0, 0.7);

  // Beat 6 — the tamper.
  tl.caption({
    at: 32.7,
    dur: 6.4,
    text: 'Try to rewrite it. Suppose someone edits entry two — turning a message created into a message deleted. Its hash changes, so entry three’s input changes, so its own hash changes — and the corruption cascades to the end of the chain.',
  });
  tl.tween(cam, CAM_TAMPER, { at: 33.0, dur: 1.4, ease: ease.move });
  tl.tween(tamperU, 1, { at: 33.8, dur: 0.8, ease: ease.move });
  tl.tween(cascadeU, 1, { at: 34.8, dur: 2.8, ease: ease.linear });
  tl.hold(39.1, 0.7);

  // Beat 7 — the verdict + single writer.
  tl.caption({
    at: 39.8,
    dur: 6.0,
    text: 'Every stored hash after the edit now disagrees with what recomputation says it should be. You cannot quietly change the past — only visibly break everything after it. A database advisory lock keeps writers to exactly one, so the chain never forks.',
  });
  tl.tween(lockU, 1, { at: 41.4, dur: 0.9, ease: ease.enter });
  tl.hold(45.8, 0.7);

  // Beat 8 — close the book.
  tl.caption({
    at: 46.5,
    dur: 6.4,
    text: 'And that completes the picture. A Buzz message is a signed nostr event; one pipeline admits it; Postgres remembers it; three tiers of fan-out deliver it; and a hash chain vouches for the whole story. No magic — just kinds, keys, and hashes.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.1, dur: 1.0, ease: ease.enter });
  tl.hold(52.9, 1.4);

  return {
    tl, cam, actorsU, chalU, respU, authedU, chainU, linksU,
    tamperU, cascadeU, lockU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const actorsU = s.get(scene.actorsU);
  const chalU = s.get(scene.chalU);
  const respU = s.get(scene.respU);
  const authedU = s.get(scene.authedU);
  const chainU = s.get(scene.chainU);
  const linksU = s.get(scene.linksU);
  const tamperU = s.get(scene.tamperU);
  const cascadeU = s.get(scene.cascadeU);
  const lockU = s.get(scene.lockU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const tampered = tamperU > 0.5;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* NIP-42 handshake */}
          {actorsU > 0 && (
            <g opacity={actorsU}>
              {[{ n: CLIENT, l: 'client', c: colors.ACCENT }, { n: RELAY, l: 'buzz-relay', c: colors.WARM }].map((o) => (
                <g key={o.l}>
                  <rect x={o.n.x - 80} y={o.n.y - 30} width={160} height={60} rx={10} fill={colors.PANEL} stroke={o.c} strokeWidth={1.6} />
                  <text x={o.n.x} y={o.n.y + 5} textAnchor="middle" fill={o.c} fontSize={14} fontWeight={600}>
                    {o.l}
                  </text>
                </g>
              ))}
              {chalU > 0 && (
                <g>
                  <line x1={RELAY.x - 80} y1={AUTH_Y - 12} x2={RELAY.x - 80 - (RELAY.x - CLIENT.x - 160) * Math.min(1, chalU)} y2={AUTH_Y - 12} stroke={colors.WARM} strokeWidth={1.5} opacity={0.8} />
                  <text x={(CLIENT.x + RELAY.x) / 2} y={AUTH_Y - 22} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="monospace" opacity={Math.min(1, chalU * 2)}>
                    ["AUTH", "&lt;challenge&gt;"]
                  </text>
                  {chalU < 1 && <circle cx={RELAY.x - 80 - (RELAY.x - CLIENT.x - 160) * chalU} cy={AUTH_Y - 12} r={6} fill={colors.WARM} />}
                </g>
              )}
              {respU > 0 && (
                <g>
                  <line x1={CLIENT.x + 80} y1={AUTH_Y + 14} x2={CLIENT.x + 80 + (RELAY.x - CLIENT.x - 160) * Math.min(1, respU)} y2={AUTH_Y + 14} stroke={colors.ACCENT} strokeWidth={1.5} opacity={0.8} />
                  <text x={(CLIENT.x + RELAY.x) / 2} y={AUTH_Y + 36} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily="monospace" opacity={Math.min(1, respU * 2)}>
                    kind 22242, signed — never stored
                  </text>
                  {respU < 1 && <circle cx={CLIENT.x + 80 + (RELAY.x - CLIENT.x - 160) * respU} cy={AUTH_Y + 14} r={6} fill={colors.ACCENT} />}
                </g>
              )}
              {authedU > 0 && (
                <g opacity={authedU}>
                  <rect x={RELAY.x - 96} y={AUTH_Y + 44} width={192} height={30} rx={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
                  <text x={RELAY.x} y={AUTH_Y + 64} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
                    AuthState::Authenticated
                  </text>
                </g>
              )}
            </g>
          )}

          {/* audit chain */}
          {ENTRIES.map((e, i) => {
            const u = clamp01(chainU * ENTRIES.length - i);
            if (u <= 0) return null;
            const x = cardX(i);
            const isTampered = tampered && e.seq === 2;
            const broken = tampered && i >= 1 && clamp01(cascadeU * 4 - (i - 1)) > 0;
            const shownAction = isTampered ? 'EventDeleted' : e.action;
            const storedHash = CHAIN[i];
            const recomputed = tampered ? TAMPERED[i] : CHAIN[i];
            const mismatch = broken && recomputed !== storedHash;
            return (
              <g key={e.seq} opacity={u}>
                <rect
                  x={x} y={CARD_Y} width={CARD_W} height={CARD_H} rx={10}
                  fill={colors.PANEL}
                  stroke={isTampered ? colors.NEGATIVE : mismatch ? colors.NEGATIVE : colors.GRID}
                  strokeWidth={isTampered || mismatch ? 2 : 1.2}
                />
                <text x={x + 14} y={CARD_Y + 24} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  seq {e.seq}
                </text>
                <text x={x + 14} y={CARD_Y + 46} fill={isTampered ? colors.NEGATIVE : colors.TEXT} fontSize={13.5} fontWeight={600}>
                  {shownAction}
                </text>
                <text x={x + 14} y={CARD_Y + 65} fill={colors.MUTED} fontSize={11.5}>
                  actor: {e.actor}
                </text>
                <text x={x + 14} y={CARD_Y + 92} fill={mismatch ? colors.NEGATIVE : colors.ACCENT} fontSize={10.5} fontFamily="monospace">
                  {shortHex(mismatch ? recomputed : storedHash, 10, 4)}
                </text>
                {mismatch && (
                  <text x={x + 14} y={CARD_Y + 108} fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
                    stored: {shortHex(storedHash, 8, 4)} ✗
                  </text>
                )}
                {/* link to next */}
                {i < ENTRIES.length - 1 && (
                  <g opacity={clamp01(linksU * (ENTRIES.length - 1) - i)}>
                    <path
                      d={`M${x + CARD_W},${CARD_Y + 88} C ${x + CARD_W + 12},${CARD_Y + 88} ${x + CARD_W + 12},${CARD_Y + 30} ${x + CARD_W + 22},${CARD_Y + 30}`}
                      fill="none"
                      stroke={mismatch ? colors.NEGATIVE : colors.ACCENT}
                      strokeWidth={1.6}
                    />
                    <text x={x + CARD_W + 11} y={CARD_Y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="monospace">
                      prev
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {chainU > 0.9 && (
            <text x={cardX(0)} y={CARD_Y - 24} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={clamp01(chainU * 4 - 3)}>
              buzz-audit — entry_hash = SHA-256(seq · action · actor · prev_hash) · real hashes
            </text>
          )}
          {lockU > 0 && (
            <g opacity={lockU}>
              <rect x={cardX(0)} y={CARD_Y + CARD_H + 26} width={330} height={32} rx={8} fill="none" stroke={colors.WARM} />
              <text x={cardX(0) + 16} y={CARD_Y + CARD_H + 47} fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
                pg_advisory_lock — exactly one writer
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={220} width={880} height={210} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Kinds, keys, and hashes — that is Buzz
          </text>
          <text x={640} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            signed events in · one pipeline · Postgres remembers · fan-out delivers
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            and the audit chain makes history tamper-evident
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-42 · buzz-audit · pg_advisory_lock
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
