// Nostr Implementation Possibilities №7 — The Signer, chapter 1.
// The problem: an app that holds nsec IS you. Grounded in NIP-01 (the secret
// key signs every event) and the security framing behind NIP-07/46/49 — the
// whole series of signer specs exists to keep that one 32-byte number out of
// application code. The digest here is real SHA-256 of the NIP-01
// serialization (toolkit sha256.ts).
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  BitField, JsonDoc, hexToBits, layoutJson, sha256Hex, shortHex,
} from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// A note and its REAL id (the thing a signer signs).
const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const CREATED_AT = 1700000000;
const CONTENT = 'signed, sealed, delivered';
const SERIAL = JSON.stringify([0, PUBKEY, CREATED_AT, 1, [], CONTENT]);
const ID = sha256Hex(SERIAL);
const ID_BITS = hexToBits(ID);

const EVENT = {
  id: ID,
  pubkey: PUBKEY,
  created_at: CREATED_AT,
  kind: 1,
  tags: [] as string[][],
  content: CONTENT,
  sig: '',
};

const LAYOUT = layoutJson(EVENT, {
  x: 90,
  y: 150,
  fontSize: 14.5,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});

const SIG_ANCHOR = LAYOUT.anchor('sig');
const GRID = { x: 840, y: 150, cell: 12, gap: 3 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

const CAM_JSON: CameraState = { x: 330, y: 300, k: 1.28 };
const CAM_NSEC: CameraState = { x: 500, y: 360, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  nsecU: ChannelRef<number>;
  hashU: ChannelRef<number>;
  signU: ChannelRef<number>;
  copyU: ChannelRef<number>;
  leakU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const nsecU = tl.channel('nsecU', 0);
  const hashU = tl.channel('hashU', 0);
  const signU = tl.channel('signU', 0);
  const copyU = tl.channel('copyU', 0);
  const leakU = tl.channel('leakU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — a note, unsigned.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is a note, ready to send. Everything is filled in but one field. The signature slot is empty — and until it is filled, this note is worth nothing to anyone.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — only the secret can fill it.
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Only one thing on earth can fill that slot: your secret key, the nsec. It hashes the note into its identifier, then signs that identifier. No secret, no signature, no note.',
  });
  tl.tween(cam, CAM_NSEC, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(nsecU, 1, { at: 7.6, dur: 0.8, ease: ease.enter });
  tl.tween(hashU, 1, { at: 8.8, dur: 1.6, ease: ease.draw });
  tl.tween(signU, 1, { at: 10.8, dur: 1.2, ease: ease.move });
  tl.hold(12.8, 0.7);

  // Beat 3 — the secret IS the identity.
  tl.caption({
    at: 13.5,
    dur: 6.2,
    text: 'So the secret key is not a password you can reset. It is the identity itself. Whoever holds it can sign as you — forever, with no way to appeal and no one to ask.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.hold(19.7, 0.7);

  // Beat 4 — the naive app holds it.
  tl.caption({
    at: 20.4,
    dur: 6.4,
    text: 'Which makes the obvious design dangerous. Paste your secret into an app and it can sign anything, at any time, while you are not looking — and a single leak copies your whole identity out the door.',
  });
  tl.tween(copyU, 1, { at: 21.0, dur: 1.6, ease: ease.enter });
  tl.tween(leakU, 1, { at: 23.4, dur: 2.0, ease: ease.linear });
  tl.hold(26.8, 0.7);

  // Beat 5 — the whole book's question.
  tl.caption({
    at: 27.5,
    dur: 6.0,
    text: 'So the signer specifications all chase one goal: let the app get signatures without ever touching the key. The secret signs. Everything else only asks.',
  });
  tl.tween(dimU, 1, { at: 27.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 28.9, dur: 1.0, ease: ease.enter });
  tl.hold(33.5, 1.2);

  return { tl, cam, jsonU, nsecU, hashU, signU, copyU, leakU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const nsecU = s.get(scene.nsecU);
  const hashU = s.get(scene.hashU);
  const signU = s.get(scene.signU);
  const copyU = s.get(scene.copyU);
  const leakU = s.get(scene.leakU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const sigFilled = signU >= 1;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc layout={LAYOUT} reveal={jsonU} hidden={sigFilled ? undefined : ['sig']} />

          {/* the nsec vault */}
          {nsecU > 0 && (
            <g opacity={nsecU}>
              <rect x={150} y={430} width={210} height={40} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
              <text x={168} y={455} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                nsec = 4c96…d1e2
              </text>
              <text x={150} y={420} fill={colors.NEGATIVE} fontSize={12} fontWeight={600}>
                the secret — never leaves
              </text>
            </g>
          )}

          {/* real digest */}
          {hashU > 0 && (
            <g opacity={hashU}>
              <text x={GRID.x} y={GRID.y - 16} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                SHA-256(serialization) — the id
              </text>
              <BitField bits={ID_BITS} x={GRID.x} y={GRID.y} cell={GRID.cell} gap={GRID.gap} reveal={hashU} settle={hashU} seed={13} />
            </g>
          )}

          {/* signature flying into the slot */}
          {signU > 0 && (
            <g opacity={clamp01(signU * 2)}>
              <text x={SIG_ANCHOR.x} y={SIG_ANCHOR.y + SIG_ANCHOR.h - 4} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace" opacity={signU}>
                "c1d7…9f3a"
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* leak overlay — screen-fixed so it reads as escaping the app */}
      {copyU > 0 && (
        <g opacity={copyU * mainOp}>
          <text x={640} y={548} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
            app holds nsec → app IS you
          </text>
          {leakU > 0 && (
            <g opacity={leakU}>
              {[0, 1, 2].map((i) => {
                const u = clamp01(leakU * 3 - i);
                const x = 640 + u * (280 + i * 40);
                return (
                  <text key={i} x={x} y={578 + i * 6} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace" opacity={0.7 * (1 - u * 0.5)}>
                    nsec ⇒
                  </text>
                );
              })}
            </g>
          )}
        </g>
      )}

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The secret signs. Everything else only asks.
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            get signatures without the app ever touching the key
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-07 · NIP-46 · NIP-49
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
