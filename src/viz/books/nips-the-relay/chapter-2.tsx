// Nostr Implementation Possibilities №5 — The Relay, chapter 2.
// NIP-42 (Authentication): the relay sends ["AUTH", <challenge>]; the client
// answers with a kind-22242 ephemeral event carrying "relay" and "challenge"
// tags and a fresh created_at (~10 min tolerance); the relay verifies and
// gates responses with "auth-required: " / "restricted: " prefixes. Message
// shapes and prefixes are the spec's own; keys/ids illustrative.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, TokenFlight, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const CHALLENGE = 'ch-3f1a9c7e5b2d';
const CLIENT_PK = '7f3a9c1e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a';

export const AUTH_EVENT = {
  kind: 22242,
  pubkey: CLIENT_PK,
  created_at: 1700000123,
  tags: [
    ['relay', 'wss://relay.example'],
    ['challenge', CHALLENGE],
  ],
  content: '',
  sig: 'a1b2…(schnorr)',
};

const LAYOUT = layoutJson(AUTH_EVENT, {
  x: 92,
  y: 210,
  fontSize: 14.5,
  inlineArrayMax: 60,
  abbrev: (_p, raw) => (raw.length > 30 ? shortHex(raw, 8, 4) : raw),
});

const CLIENT = { x: 200, y: 110 };
const RELAY = { x: 1040, y: 110 };
const WIRE_Y = 110;

// frames traveling on the wire: [label, y-offset used for stacking replies]
const CAM_DOC: CameraState = { x: 330, y: 340, k: 1.25 };
const CAM_WIRE: CameraState = { x: 640, y: 200, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nodesU: ChannelRef<number>;
  denyU: ChannelRef<number>;
  challU: ChannelRef<number>;
  buildU: ChannelRef<number>;
  tagsU: ChannelRef<number>;
  clockU: ChannelRef<number>;
  sendU: ChannelRef<number>;
  checkU: ChannelRef<number>;
  okU: ChannelRef<number>;
  restrictU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const nodesU = tl.channel('nodesU', 0);
  const denyU = tl.channel('denyU', 0);
  const challU = tl.channel('challU', 0);
  const buildU = tl.channel('buildU', 0);
  const tagsU = tl.channel('tagsU', 0);
  const clockU = tl.channel('clockU', 0);
  const sendU = tl.channel('sendU', 0);
  const checkU = tl.channel('checkU', 0);
  const okU = tl.channel('okU', 0);
  const restrictU = tl.channel('restrictU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Most relays will talk to anyone. But some hold private rooms — direct messages, paid shelves — and for those, the relay needs to know who is on the other end of the socket.',
  });
  tl.tween(nodesU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_WIRE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Ask for someone else\'s messages and the answer comes back closed, with a machine-readable prefix: auth dash required. Not an error — an invitation.',
  });
  tl.tween(denyU, 1, { at: 7.6, dur: 1.6, ease: ease.linear });
  tl.hold(12.6, 0.7);

  tl.caption({
    at: 13.3,
    dur: 5.6,
    text: 'The relay opens the handshake by sending a challenge: one random string, fresh for this connection. It will never mean anything again.',
  });
  tl.tween(challU, 1, { at: 14.2, dur: 1.6, ease: ease.linear });
  tl.hold(18.9, 0.7);

  tl.caption({
    at: 19.6,
    dur: 6.2,
    text: 'The client answers with the strangest event in nostr: kind twenty-two thousand two hundred forty-two. It is ephemeral — never stored, never broadcast. Its only job is to be signed.',
  });
  tl.tween(cam, CAM_DOC, { at: 20.0, dur: 1.4, ease: ease.move });
  tl.tween(buildU, 1, { at: 20.8, dur: 2.0, ease: ease.draw });
  tl.hold(25.8, 0.7);

  tl.caption({
    at: 26.5,
    dur: 6.2,
    text: 'Two tags do the work. The relay tag names which relay this proof is for, so it cannot be replayed elsewhere. The challenge tag echoes the random string, so it cannot be prepared in advance.',
  });
  tl.tween(tagsU, 1, { at: 27.2, dur: 1.6, ease: ease.enter });
  tl.hold(32.7, 0.7);

  tl.caption({
    at: 33.4,
    dur: 5.4,
    text: 'And the timestamp must sit within about ten minutes of now — a third fence, this one against replaying yesterday\'s proof.',
  });
  tl.tween(clockU, 1, { at: 34.2, dur: 1.2, ease: ease.enter });
  tl.hold(38.8, 0.7);

  tl.caption({
    at: 39.5,
    dur: 6.0,
    text: 'Sign it, send it back inside an auth frame, and the relay checks all three fences plus the signature. From this moment the connection itself is authenticated — every later request inherits it.',
  });
  tl.tween(cam, CAM_WIRE, { at: 39.8, dur: 1.4, ease: ease.move });
  tl.tween(sendU, 1, { at: 40.6, dur: 1.4, ease: ease.linear });
  tl.tween(checkU, 1, { at: 42.2, dur: 1.0, ease: ease.pop });
  tl.tween(okU, 1, { at: 43.4, dur: 1.2, ease: ease.linear });
  tl.hold(45.9, 0.7);

  tl.caption({
    at: 46.6,
    dur: 5.6,
    text: 'One more prefix completes the vocabulary: restricted. It means you proved who you are — and this key still is not allowed. Authentication is not authorization.',
  });
  tl.tween(restrictU, 1, { at: 47.6, dur: 1.0, ease: ease.enter });
  tl.hold(52.2, 0.7);

  tl.caption({
    at: 52.9,
    dur: 5.0,
    text: 'No cookies, no passwords, no sessions to steal. The same keypair that signs your notes signs your way through the door.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 53.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 53.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 54.4, dur: 1.0, ease: ease.enter });
  tl.hold(57.9, 1.2);

  return { tl, cam, nodesU, denyU, challU, buildU, tagsU, clockU, sendU, checkU, okU, restrictU, dimU, closeU };
}

const scene = buildScene();

function Frame({ label, u, dir, y, color }: { label: string; u: number; dir: 1 | -1; y: number; color: string }) {
  if (u <= 0) return null;
  const from = dir === 1 ? CLIENT.x + 90 : RELAY.x - 90;
  const to = dir === 1 ? RELAY.x - 90 : CLIENT.x + 90;
  const x = from + (to - from) * clamp01(u);
  return (
    <g opacity={Math.min(1, u * 4)}>
      <rect x={x - 128} y={y - 15} width={256} height={26} rx={7} fill={colors.PANEL} stroke={color} opacity={0.95} />
      <text x={x} y={y + 3} textAnchor="middle" fill={color} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const denyU = s.get(scene.denyU);
  const challU = s.get(scene.challU);
  const buildU = s.get(scene.buildU);
  const tagsU = s.get(scene.tagsU);
  const clockU = s.get(scene.clockU);
  const sendU = s.get(scene.sendU);
  const checkU = s.get(scene.checkU);
  const okU = s.get(scene.okU);
  const restrictU = s.get(scene.restrictU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const focus = tagsU > 0 && clockU <= 0 ? ['tags'] : clockU > 0 && sendU <= 0 ? ['created_at'] : undefined;
  const focusU = tagsU > 0 && clockU <= 0 ? tagsU : clockU > 0 && sendU <= 0 ? clockU : 0;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {nodesU > 0 && (
            <g>
              <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="you" u={nodesU} />
              <ServiceNode x={RELAY.x} y={RELAY.y} kind="server" label="relay.example" sublabel="auth-gated" u={nodesU} />
              <line x1={CLIENT.x + 90} y1={WIRE_Y} x2={RELAY.x - 90} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={1.5} opacity={nodesU * 0.7} />
            </g>
          )}

          <Frame label='["REQ", "dms", {"kinds":[1059]}]' u={denyU * 2} dir={1} y={WIRE_Y - 34} color={colors.MUTED} />
          <Frame label='["CLOSED","dms","auth-required: …"]' u={denyU * 2 - 1} dir={-1} y={WIRE_Y + 36} color={colors.NEGATIVE} />
          <Frame label={`["AUTH", "${CHALLENGE}"]`} u={challU} dir={-1} y={WIRE_Y + 36} color={colors.WARM} />
          <Frame label='["AUTH", {kind: 22242, …}]' u={sendU} dir={1} y={WIRE_Y - 34} color={colors.ACCENT} />
          <Frame label='["OK", "…", true, ""]' u={okU} dir={-1} y={WIRE_Y + 36} color={colors.POSITIVE} />

          <JsonDoc layout={LAYOUT} reveal={buildU} focus={focus} focusU={focusU} />

          {/* challenge echo: string flies from the wire frame into the tag slot */}
          {buildU >= 1 && tagsU > 0 && tagsU < 1 && (
            <TokenFlight
              from={{ x: 640, y: WIRE_Y + 36 }}
              to={{ x: LAYOUT.anchor('tags[1][1]').cx, y: LAYOUT.anchor('tags[1][1]').cy + 5 }}
              u={tagsU}
              text={CHALLENGE}
              fill={colors.WARM}
              fontSize={12.5}
              lift={90}
              holdAtEnd={false}
            />
          )}

          {/* created_at tolerance window */}
          {clockU > 0 && (
            <g opacity={clockU}>
              <line x1={620} y1={330} x2={980} y2={330} stroke={colors.GRID} strokeWidth={1.5} />
              <rect x={740} y={318} width={120} height={24} rx={6} fill={colors.WARM} opacity={0.18} />
              <line x1={800} y1={316} x2={800} y2={344} stroke={colors.WARM} strokeWidth={2} />
              <text x={800} y={306} textAnchor="middle" fill={colors.WARM} fontSize={12}>now</text>
              <text x={740} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>−10 min</text>
              <text x={860} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>+10 min</text>
              <text x={800} y={388} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                created_at must land in the window
              </text>
            </g>
          )}

          {/* relay's three checks */}
          {checkU > 0 && (
            <g opacity={checkU}>
              {['relay tag matches', 'challenge echoes', 'clock in window · sig valid'].map((c, i) => (
                <g key={c}>
                  <circle cx={952} cy={210 + i * 34} r={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                  <path d={`M${946} ${210 + i * 34} l4 4 l7 -8`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeLinecap="round" />
                  <text x={972} y={215 + i * 34} fill={colors.TEXT} fontSize={12.5}>{c}</text>
                </g>
              ))}
            </g>
          )}

          {restrictU > 0 && (
            <g opacity={restrictU}>
              <rect x={620} y={430} width={470} height={58} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={640} y={454} fill={colors.NEGATIVE} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
                ["CLOSED", "vip", "restricted: not a member"]
              </text>
              <text x={640} y={476} fill={colors.MUTED} fontSize={12}>
                authenticated ≠ authorized
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={235} width={840} height={185} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={303} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The keypair is the session
          </text>
          <text x={640} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            challenge → signed kind 22242 → the connection itself is authenticated
          </text>
          <text x={640} y={387} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-42 · "auth-required: " / "restricted: "
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
