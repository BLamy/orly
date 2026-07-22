// Nostr Implementation Possibilities №7 — The Signer, chapter 2.
// NIP-07: the browser extension signer. The web app calls window.nostr —
// getPublicKey() and signEvent(event) — and an unsigned event crosses a trust
// boundary into the extension, which fills in id, pubkey, and sig and hands it
// back. The nsec lives only on the extension side and never crosses. Optional
// nip44.encrypt/decrypt live behind the same door. Digest is real SHA-256.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, sha256Hex, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const CONTENT = 'gm from a web app';
const SERIAL = JSON.stringify([0, PUBKEY, 1700000000, 1, [], CONTENT]);
const ID = sha256Hex(SERIAL);

// The app-side draft: no id, no pubkey, no sig.
const DRAFT = { created_at: 1700000000, kind: 1, tags: [] as string[][], content: CONTENT };
const DRAFT_LAYOUT = layoutJson(DRAFT, { x: 70, y: 200, fontSize: 13.5 });

// The extension-side result: filled in.
const SIGNED = {
  id: ID,
  pubkey: PUBKEY,
  created_at: 1700000000,
  kind: 1,
  tags: [] as string[][],
  content: CONTENT,
  sig: 'c1d7f0a2…9f3a',
};
const SIGNED_LAYOUT = layoutJson(SIGNED, { x: 720, y: 150, fontSize: 13, abbrev: (_p, raw) => (raw.length > 22 ? shortHex(raw) : raw) });

const BOUNDARY_X = 640;
const APP = { x: 300, y: 110 };
const EXT = { x: 940, y: 110 };

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_CALL: CameraState = { x: 640, y: 300, k: 1.08 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  appU: ChannelRef<number>;
  extU: ChannelRef<number>;
  probeU: ChannelRef<number>;
  draftU: ChannelRef<number>;
  crossU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  backU: ChannelRef<number>;
  encU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const appU = tl.channel('appU', 0);
  const extU = tl.channel('extU', 0);
  const probeU = tl.channel('probeU', 0);
  const draftU = tl.channel('draftU', 0);
  const crossU = tl.channel('crossU', 0);
  const fillU = tl.channel('fillU', 0);
  const backU = tl.channel('backU', 0);
  const encU = tl.channel('encU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — two sides of a wall.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The simplest signer already lives in most browsers: an extension. On the left, the web app. On the right, the extension. Between them, a wall the secret key never crosses.',
  });
  tl.tween(appU, 1, { at: 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(extU, 1, { at: 1.3, dur: 0.8, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — window.nostr handshake.
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'The app looks for one object the extension injects: window dot nostr. If it is there, the app can ask two things — who are you, and please sign this. It asks for the public key first.',
  });
  tl.tween(probeU, 1, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.hold(13.0, 0.7);

  // Beat 3 — the unsigned draft.
  tl.caption({
    at: 13.7,
    dur: 5.8,
    text: 'Now the real move. The app builds a draft event — kind, timestamp, content — but leaves the identity fields blank. It cannot compute them. It has no key.',
  });
  tl.tween(cam, CAM_CALL, { at: 13.9, dur: 1.4, ease: ease.move });
  tl.tween(draftU, 1, { at: 14.4, dur: 1.6, ease: ease.draw });
  tl.hold(19.5, 0.7);

  // Beat 4 — cross the wall, get filled in, come back.
  tl.caption({
    at: 20.2,
    dur: 6.6,
    text: 'It calls the sign method, and the draft crosses the wall. On the far side, and only there, the extension hashes it, adds the public key, signs the identifier, and hands back a complete event. The key stayed home.',
  });
  tl.tween(crossU, 1, { at: 20.8, dur: 1.4, ease: ease.move });
  tl.tween(fillU, 1, { at: 22.6, dur: 1.6, ease: ease.draw });
  tl.tween(backU, 1, { at: 24.6, dur: 1.4, ease: ease.move });
  tl.hold(26.8, 0.7);

  // Beat 5 — same wall guards encryption.
  tl.caption({
    at: 27.5,
    dur: 5.8,
    text: 'The same door optionally guards encryption — encrypt and decrypt for private messages run behind the wall too, so the app handles ciphertext it can send but never the key that made it.',
  });
  tl.tween(cam, CAM_WIDE, { at: 27.7, dur: 1.3, ease: ease.move });
  tl.tween(encU, 1, { at: 28.4, dur: 1.4, ease: ease.enter });
  tl.hold(33.3, 0.7);

  // Beat 6 — close.
  tl.caption({
    at: 34.0,
    dur: 5.6,
    text: 'No copy-paste, no secret in the page. The app describes what it wants signed; the extension decides whether to sign it. That division of labor is the whole idea — and the next chapter stretches the wall across the internet.',
  });
  tl.tween(dimU, 1, { at: 34.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 35.4, dur: 1.0, ease: ease.enter });
  tl.hold(39.6, 1.2);

  return { tl, cam, appU, extU, probeU, draftU, crossU, fillU, backU, encU, dimU, closeU };
}

const scene = buildScene();

function Panel({ x, y, w, h, label, color, u }: { x: number; y: number; w: number; h: number; label: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={colors.PANEL} opacity={0.5} stroke={color} strokeWidth={1.6} />
      <text x={x + 16} y={y + 26} fill={color} fontSize={14} fontWeight={600}>{label}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const appU = s.get(scene.appU);
  const extU = s.get(scene.extU);
  const probeU = s.get(scene.probeU);
  const draftU = s.get(scene.draftU);
  const crossU = s.get(scene.crossU);
  const fillU = s.get(scene.fillU);
  const backU = s.get(scene.backU);
  const encU = s.get(scene.encU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // draft crosses left→right on crossU, signed copy returns right→left on backU
  const draftGone = crossU > 0.05;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the wall */}
          <line x1={BOUNDARY_X} y1={80} x2={BOUNDARY_X} y2={560} stroke={colors.GRID} strokeWidth={2} strokeDasharray="6 6" opacity={Math.max(appU, extU) * 0.8} />
          <text x={BOUNDARY_X} y={72} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={Math.max(appU, extU)}>
            trust boundary — nsec never crosses →|
          </text>

          <Panel x={APP.x - 220} y={APP.y} w={440} h={70} label="web app  ·  window.nostr" color={colors.ACCENT} u={appU} />
          <Panel x={EXT.x - 220} y={EXT.y} w={440} h={70} label="browser extension  ·  holds nsec" color={colors.NEGATIVE} u={extU} />

          {/* getPublicKey probe */}
          {probeU > 0 && (
            <g opacity={probeU}>
              <text x={BOUNDARY_X} y={150} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                getPublicKey()
              </text>
              <TokenFlight from={{ x: APP.x + 40, y: 150 }} to={{ x: EXT.x - 60, y: 150 }} u={clamp01(probeU * 2)} text="?" fill={colors.ACCENT} fontSize={16} lift={26} />
              <TokenFlight from={{ x: EXT.x - 60, y: 168 }} to={{ x: APP.x + 40, y: 168 }} u={clamp01(probeU * 2 - 1)} text={shortHex(PUBKEY, 8, 4)} fill={colors.POSITIVE} fontSize={12} lift={26} />
            </g>
          )}

          {/* the app-side draft */}
          {draftU > 0 && !draftGone && (
            <g opacity={draftU * (1 - clamp01(crossU * 4))}>
              <JsonDoc layout={DRAFT_LAYOUT} reveal={draftU} />
              <text x={70} y={188} fill={colors.WARM} fontSize={11.5} fontFamily="monospace">
                unsigned draft — no id, no pubkey, no sig
              </text>
            </g>
          )}

          {/* draft crossing as a packet */}
          {crossU > 0 && backU < 1 && (
            <TokenFlight
              from={{ x: 260, y: 300 }}
              to={{ x: 760, y: 260 }}
              u={crossU * (1 - clamp01(backU * 2))}
              text="signEvent(draft)"
              fill={colors.ACCENT}
              fontSize={13}
              lift={60}
            />
          )}

          {/* extension fills it in */}
          {fillU > 0 && (
            <g opacity={fillU}>
              <JsonDoc layout={SIGNED_LAYOUT} reveal={fillU} focus={['id', 'pubkey', 'sig']} focusU={clamp01(fillU * 2 - 1)} />
              <text x={720} y={138} fill={colors.POSITIVE} fontSize={11.5} fontFamily="monospace">
                extension adds id · pubkey · sig
              </text>
            </g>
          )}

          {/* signed copy returns */}
          {backU > 0 && (
            <TokenFlight from={{ x: 760, y: 300 }} to={{ x: 300, y: 340 }} u={backU} text="signed event ✓" fill={colors.POSITIVE} fontSize={13} lift={60} />
          )}

          {/* encryption behind the same door */}
          {encU > 0 && (
            <g opacity={encU}>
              <text x={EXT.x} y={470} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5} fontFamily="monospace">
                nip44.encrypt / decrypt
              </text>
              <text x={EXT.x} y={492} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                ciphertext out, key stays in
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The app asks; the extension answers
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            window.nostr: getPublicKey and signEvent — the key never enters the page
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-07 · browser extension signer
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
