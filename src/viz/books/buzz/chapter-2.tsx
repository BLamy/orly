// Buzz — chapter 2: one identity, for people and agents alike.
// Identity on Buzz is a keypair, not an account. A person (Maya) and an agent
// (Goose) use the exact same machinery: every action becomes a signed nostr
// event carrying the author's pubkey and a Schnorr signature; the relay
// verifies it, and authenticates a connection with NIP-42 (kind 22242,
// crates/buzz-core/src/kind.rs). An agent is therefore an equal member — its
// own keys, channels, and audit trail; everything it does is attributable.
// The ids are REAL SHA-256 of the NIP-01 serialization; pubkeys/sig are
// illustrative placeholders.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { BitField, hexToBits, sha256Hex, shortHex } from '../../primitives';

const MAYA_PK = '9c41e7b208aa3f5dd1c8be22f0e97ad3164c05e8b97a2f4de3908b16fa74c2d1';
const GOOSE_PK = '2f7a1c9e4b6d0a83f5c2e8b1d4a7c0e6b9f2a5c8e1b4d7a0c3e6f9b2d5a8c1e4';
const CH = '7b1e4c0a-2d5f-4e8b-9c3a-6f0d2e8b4a1c';

const mkId = (pk: string, kind: number, content: string, tags: string[][]) =>
  sha256Hex(JSON.stringify([0, pk, 1753142400, kind, tags, content]));

const MAYA_ID = mkId(MAYA_PK, 9, 'shipping the auth fix — PTAL', [['h', CH]]);
const GOOSE_ID = mkId(GOOSE_PK, 9, 'reviewed patch 4a2f: LGTM, one nit inline', [['h', CH]]);

const ACTORS = [
  { name: 'maya', role: 'person', pk: MAYA_PK, id: MAYA_ID, x: 150, color: colors.WARM },
  { name: 'goose', role: 'agent', pk: GOOSE_PK, id: GOOSE_ID, x: 700, color: colors.SECONDARY },
];

const CAM_KEYS: CameraState = { x: 640, y: 250, k: 1.1 };
const CAM_VERIFY: CameraState = { x: 640, y: 340, k: 1.05 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const keysU = tl.channel('keysU', 0);
  const sameU = tl.channel('sameU', 0);
  const signU = tl.channel('signU', 0);
  const settleU = tl.channel('settleU', 0);
  const verifyU = tl.channel('verifyU', 0);
  const authU = tl.channel('authU', 0);
  const equalU = tl.channel('equalU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'On Buzz, identity is not an account handed to you by an administrator. It is a keypair — a secret key you hold, and a public key that names you. That is the entire login.',
  });
  tl.tween(keysU, 1, { at: 0.8, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAM_KEYS, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(6.5, 0.7);

  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'Here is Maya, a person on the team, and here is Goose, an agent. Look closely, because the point is that there is nothing to see. They use exactly the same identity system.',
  });
  tl.tween(sameU, 1, { at: 8.4, dur: 1.6, ease: ease.enter });
  tl.hold(13.4, 0.7);

  tl.caption({
    at: 14.1,
    dur: 6.6,
    text: 'Both of them sign what they do. Every message and every action becomes a nostr event carrying its author’s public key and a signature only their secret key could produce. These ids are the real hashes of these two events.',
  });
  tl.tween(signU, 1, { at: 14.6, dur: 1.4, ease: ease.enter });
  tl.tween(settleU, 1, { at: 15.8, dur: 3.0, ease: ease.linear });
  tl.hold(20.7, 0.7);

  tl.caption({
    at: 21.4,
    dur: 6.4,
    text: 'The relay checks that signature before it stores anything. It can even prove who is on the far end of a connection without a password — a challenge and response the spec calls authentication, kind twenty-two thousand two hundred forty-two.',
  });
  tl.tween(cam, CAM_VERIFY, { at: 21.6, dur: 1.4, ease: ease.move });
  tl.tween(verifyU, 1, { at: 22.8, dur: 1.0, ease: ease.pop });
  tl.tween(authU, 1, { at: 24.0, dur: 1.0, ease: ease.enter });
  tl.hold(27.8, 0.7);

  tl.caption({
    at: 28.5,
    dur: 6.6,
    text: 'So an agent on Buzz is not a bot bolted onto a human’s account. It is an equal member: its own keys, its own channels, its own audit trail. Everything it does is signed, and therefore attributable to it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 28.7, dur: 1.4, ease: ease.move });
  tl.tween(equalU, 1, { at: 29.6, dur: 1.4, ease: ease.enter });
  tl.hold(35.1, 0.7);

  tl.caption({
    at: 35.8,
    dur: 5.4,
    text: 'One identity system for people and agents alike — with trust and accountability built in at the level of the key itself.',
  });
  tl.tween(dimU, 1, { at: 36.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 37.2, dur: 1.0, ease: ease.enter });
  tl.hold(41.2, 1.2);

  return { tl, cam, keysU, sameU, signU, settleU, verifyU, authU, equalU, dimU, closeU };
}

const scene = buildScene();

function ActorCard({
  a, keysU, sameU, signU, settleU, verifyU, equalU,
}: {
  a: (typeof ACTORS)[number];
  keysU: number; sameU: number; signU: number; settleU: number; verifyU: number; equalU: number;
}) {
  const cx = a.x + 190;
  return (
    <g>
      {keysU > 0 && (
        <g opacity={keysU}>
          <circle cx={a.x + 40} cy={150} r={18} fill="none" stroke={a.color} strokeWidth={2} />
          <circle cx={a.x + 40} cy={150} r={6} fill={a.color} />
          <text x={a.x + 70} y={146} fill={colors.TEXT} fontSize={16} fontWeight={600}>{a.name}</text>
          <text x={a.x + 70} y={166} fill={colors.MUTED} fontSize={12} fontFamily="monospace">{a.role}</text>
          <text x={a.x + 40} y={196} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily="monospace">nsec 🔒</text>
          <text x={a.x + 40} y={212} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily="monospace">{shortHex(a.pk, 6, 2)}</text>
        </g>
      )}
      {sameU > 0 && (
        <text x={cx} y={236} textAnchor="middle" fill={colors.ACCENT} fontSize={12} opacity={sameU} fontFamily="monospace">
          same event · same keys · same rails
        </text>
      )}
      {signU > 0 && (
        <g opacity={signU}>
          <rect x={a.x} y={256} width={380} height={150} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={a.x + 16} y={282} fill={colors.MUTED} fontSize={12} fontFamily="monospace">kind 9 · signed by {a.name}</text>
          <BitField bits={hexToBits(a.id)} x={a.x + 16} y={296} cell={9} gap={2} reveal={signU} settle={settleU} onColor={a.color} seed={a.role === 'agent' ? 12 : 7} />
          <text x={a.x + 224} y={316} fill={colors.TEXT} fontSize={12} fontFamily="monospace">id</text>
          <text x={a.x + 224} y={334} fill={a.color} fontSize={11} fontFamily="monospace">{shortHex(a.id, 8, 4)}</text>
          {verifyU > 0 && (
            <g opacity={verifyU}>
              <circle cx={a.x + 236} cy={372} r={11} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <path d={`M${a.x + 230} 372 l4 4 l8 -9`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} strokeLinecap="round" />
              <text x={a.x + 254} y={376} fill={colors.POSITIVE} fontSize={12}>sig ok</text>
            </g>
          )}
        </g>
      )}
      {equalU > 0 && (
        <text x={cx} y={430} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={equalU}>
          {a.role === 'agent' ? 'equal member — keys · channels · audit trail' : 'a member of the team'}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const keysU = s.get(scene.keysU);
  const sameU = s.get(scene.sameU);
  const signU = s.get(scene.signU);
  const settleU = s.get(scene.settleU);
  const verifyU = s.get(scene.verifyU);
  const authU = s.get(scene.authU);
  const equalU = s.get(scene.equalU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {ACTORS.map((a) => (
            <ActorCard key={a.name} a={a} keysU={keysU} sameU={sameU} signU={signU} settleU={settleU} verifyU={verifyU} equalU={equalU} />
          ))}
          {verifyU > 0 && (
            <g opacity={verifyU}>
              <rect x={545} y={300} width={190} height={70} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={640} y={332} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={600}>your relay</text>
              <text x={640} y={354} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">verify hash + sig</text>
            </g>
          )}
          {authU > 0 && (
            <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} opacity={authU} fontFamily="monospace">
              NIP-42 auth · kind 22242 · no password
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={600}>People and agents, one identity</text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={16}>an agent is an equal member — its own keys, channels, and audit trail</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">signed · attributable · NIP-42 auth = kind 22242</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
