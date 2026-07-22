// Nostr Implementation Possibilities №7 — The Signer, chapter 3.
// NIP-46 remote signing. The wall from chapter 2 stretches across the internet:
// the signer lives on a phone or a bunker, the app on a laptop, and they talk
// through a relay in kind-24133 events whose content is NIP-44-encrypted.
// Three keypairs: the app's disposable client key, the remote-signer key that
// encrypts the channel, and the user key that actually signs. A bunker:// URI
// bootstraps it; sign_event is a request/response with a matching id.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, ServiceNode, TokenFlight } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const APP = { x: 250, y: 330 };
const RELAY = { x: 640, y: 210 };
const SIGNER = { x: 1030, y: 330 };
const HALF_W = 84;

// the request/response payloads (NIP-46 shapes)
const REQ = '{ id, method: "sign_event", params: [event] }';
const RES = '{ id, result: signedEvent }';

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_RELAY: CameraState = { x: 640, y: 300, k: 1.06 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  uriU: ChannelRef<number>;
  appU: ChannelRef<number>;
  signerU: ChannelRef<number>;
  relayU: ChannelRef<number>;
  connU: ChannelRef<number>;
  keysU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  wrapU: ChannelRef<number>;
  resU: ChannelRef<number>;
  authU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const uriU = tl.channel('uriU', 0);
  const appU = tl.channel('appU', 0);
  const signerU = tl.channel('signerU', 0);
  const relayU = tl.channel('relayU', 0);
  const connU = tl.channel('connU', 0);
  const keysU = tl.channel('keysU', 0);
  const reqU = tl.channel('reqU', 0);
  const wrapU = tl.channel('wrapU', 0);
  const resU = tl.channel('resU', 0);
  const authU = tl.channel('authU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the bunker URI bootstraps a session.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'What if the key lives on your phone and the app runs on your laptop? Remote signing stretches the same wall across the internet. It starts with one string you scan: a bunker U-R-I.',
  });
  tl.tween(uriU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });
  tl.hold(6.5, 0.7);

  // Beat 2 — three parties, one relay in the middle.
  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'The bunker string names a signer public key and a relay. Now there are two machines that never connect directly — the app here, the signer there — and a relay in the middle passing notes between them.',
  });
  tl.tween(uriU, 0, { at: 7.4, dur: 0.8, ease: ease.move });
  tl.tween(appU, 1, { at: 7.8, dur: 0.7, ease: ease.enter });
  tl.tween(signerU, 1, { at: 8.4, dur: 0.7, ease: ease.enter });
  tl.tween(relayU, 1, { at: 9.0, dur: 0.7, ease: ease.enter });
  tl.tween(connU, 1, { at: 9.8, dur: 1.8, ease: ease.draw });
  tl.hold(13.4, 0.7);

  // Beat 3 — three keypairs.
  tl.caption({
    at: 14.1,
    dur: 6.4,
    text: 'Three keypairs are in play. The app makes a throwaway client key just for this. The signer has its own key that encrypts the channel. And behind the signer sits the real user key — the only one that ever produces a signature.',
  });
  tl.tween(keysU, 1, { at: 14.6, dur: 2.4, ease: ease.enter });
  tl.hold(20.5, 0.7);

  // Beat 4 — the request, encrypted, through the relay.
  tl.caption({
    at: 21.2,
    dur: 6.6,
    text: 'To sign, the app sends a request — a sign method, an event, and a random identifier — wraps it as a kind twenty-four-one-three-three event, encrypts the content, and publishes it to the relay for the signer to pick up.',
  });
  tl.tween(cam, CAM_RELAY, { at: 21.4, dur: 1.4, ease: ease.move });
  tl.tween(reqU, 1, { at: 22.2, dur: 1.2, ease: ease.enter });
  tl.tween(wrapU, 1, { at: 23.8, dur: 2.4, ease: ease.linear });
  tl.hold(27.8, 0.7);

  // Beat 5 — the response comes back with the matching id.
  tl.caption({
    at: 28.5,
    dur: 6.2,
    text: 'The signer decrypts it, decides whether to allow it, signs with the user key, and sends back a response carrying the same id and the finished event. The app matches the id to its pending request. The user key never moved.',
  });
  tl.tween(resU, 1, { at: 29.0, dur: 2.6, ease: ease.linear });
  tl.hold(34.7, 0.7);

  // Beat 6 — the auth_url escape hatch.
  tl.caption({
    at: 35.4,
    dur: 5.8,
    text: 'And if the signer wants a human to approve first, it can answer with an auth U-R-L instead — the app opens it, you tap approve on your phone, and the real answer arrives on the same request id.',
  });
  tl.tween(cam, CAM_WIDE, { at: 35.6, dur: 1.3, ease: ease.move });
  tl.tween(authU, 1, { at: 36.2, dur: 1.4, ease: ease.enter });
  tl.hold(41.2, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.9,
    dur: 5.4,
    text: 'The app never held the key and never even shared a network with it. It only ever sent a message and waited for a reply. Remote signing is chapter two, played over a relay.',
  });
  tl.tween(dimU, 1, { at: 42.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.3, dur: 1.0, ease: ease.enter });
  tl.hold(47.3, 1.2);

  return { tl, cam, uriU, appU, signerU, relayU, connU, keysU, reqU, wrapU, resU, authU, dimU, closeU };
}

const scene = buildScene();

function KeyChip({ x, y, label, sub, color, u }: { x: number; y: number; label: string; sub: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x - 78} y={y - 16} width={156} height={38} rx={8} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x} y={y - 2} textAnchor="middle" fill={color} fontSize={12} fontFamily="monospace">{label}</text>
      <text x={x} y={y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>{sub}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const uriU = s.get(scene.uriU);
  const appU = s.get(scene.appU);
  const signerU = s.get(scene.signerU);
  const relayU = s.get(scene.relayU);
  const connU = s.get(scene.connU);
  const keysU = s.get(scene.keysU);
  const reqU = s.get(scene.reqU);
  const wrapU = s.get(scene.wrapU);
  const resU = s.get(scene.resU);
  const authU = s.get(scene.authU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      {/* bunker URI banner (screen-fixed, early) */}
      {uriU > 0 && (
        <g opacity={uriU * mainOp}>
          <rect x={320} y={300} width={640} height={70} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
          <text x={640} y={332} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily="monospace">
            bunker://&lt;signer-pubkey&gt;
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
            ?relay=wss://relay.example&amp;secret=…
          </text>
        </g>
      )}

      <g opacity={mainOp}>
        <Camera {...cam}>
          {appU > 0 && <ServiceNode x={APP.x} y={APP.y} kind="client" label="app" sublabel="laptop" u={appU} />}
          {relayU > 0 && <ServiceNode x={RELAY.x} y={RELAY.y} kind="server" label="relay" sublabel="wss://" u={relayU} />}
          {signerU > 0 && <ServiceNode x={SIGNER.x} y={SIGNER.y} kind="mobile" label="signer" sublabel="phone · bunker" u={signerU} />}

          {connU > 0 && (
            <>
              <Connection from={{ x: APP.x + HALF_W, y: APP.y }} to={{ x: RELAY.x - HALF_W, y: RELAY.y }} u={connU} label="kind 24133" color={colors.ACCENT} />
              <Connection from={{ x: SIGNER.x - HALF_W, y: SIGNER.y }} to={{ x: RELAY.x + HALF_W, y: RELAY.y }} u={connU} label="kind 24133" color={colors.NEGATIVE} />
            </>
          )}

          {/* three keypairs */}
          {keysU > 0 && (
            <>
              <KeyChip x={APP.x} y={APP.y + 96} label="client key" sub="disposable" color={colors.ACCENT} u={clamp01(keysU * 3)} />
              <KeyChip x={SIGNER.x} y={SIGNER.y + 96} label="signer key" sub="encrypts channel" color={colors.NEGATIVE} u={clamp01(keysU * 3 - 1)} />
              <KeyChip x={SIGNER.x} y={SIGNER.y + 140} label="user key" sub="signs — never moves" color={colors.WARM} u={clamp01(keysU * 3 - 2)} />
            </>
          )}

          {/* request payload chip on the app side */}
          {reqU > 0 && wrapU < 0.05 && (
            <g opacity={reqU}>
              <rect x={APP.x - 150} y={APP.y - 150} width={300} height={40} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={APP.x} y={APP.y - 125} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily="monospace">{REQ}</text>
            </g>
          )}

          {/* encrypted request app → relay → signer */}
          {wrapU > 0 && (
            <>
              <TokenFlight
                from={{ x: APP.x + 40, y: APP.y - 40 }}
                to={{ x: RELAY.x, y: RELAY.y + 40 }}
                u={clamp01(wrapU * 2)}
                text="🔒 sign_event"
                fill={colors.ACCENT}
                fontSize={12.5}
                lift={40}
              />
              <TokenFlight
                from={{ x: RELAY.x, y: RELAY.y + 40 }}
                to={{ x: SIGNER.x - 40, y: SIGNER.y - 40 }}
                u={clamp01(wrapU * 2 - 1)}
                text="🔒 sign_event"
                fill={colors.NEGATIVE}
                fontSize={12.5}
                lift={40}
              />
            </>
          )}

          {/* response signer → relay → app */}
          {resU > 0 && (
            <>
              <TokenFlight
                from={{ x: SIGNER.x - 40, y: SIGNER.y + 20 }}
                to={{ x: RELAY.x, y: RELAY.y + 60 }}
                u={clamp01(resU * 2)}
                text="🔒 result: id ✓"
                fill={colors.POSITIVE}
                fontSize={12.5}
                lift={44}
              />
              <TokenFlight
                from={{ x: RELAY.x, y: RELAY.y + 60 }}
                to={{ x: APP.x + 40, y: APP.y + 20 }}
                u={clamp01(resU * 2 - 1)}
                text="🔒 result: id ✓"
                fill={colors.POSITIVE}
                fontSize={12.5}
                lift={44}
              />
            </>
          )}

          {/* auth_url escape hatch */}
          {authU > 0 && (
            <g opacity={authU}>
              <rect x={RELAY.x - 150} y={470} width={300} height={54} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
              <text x={RELAY.x} y={494} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
                result: "auth_url"
              </text>
              <text x={RELAY.x} y={514} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                approve on your phone → same request id
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A conversation, not a handoff
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            encrypted kind-24133 request/response over a relay — the user key never moves
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-46 · remote signing · bunker://
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
