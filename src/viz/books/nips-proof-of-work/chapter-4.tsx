// Nostr Implementation Possibilities №6 — Proof of Work, chapter 4.
// Delegated PoW. NIP-13: the NIP-01 id commits to [0, pubkey, created_at,
// kind, tags, content] — the SIGNATURE is not in the preimage — so "PoW can
// be outsourced to PoW providers, perhaps for a fee". The mined id shown is
// chapter 2's real one (same serialization, re-verified at load).
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  BitField, Connection, ServiceNode, hexToBits, leadingZeroBits, sha256Hex, shortHex,
} from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const TARGET = 14;
const WIN_NONCE = 52665;
const MINED_ID = sha256Hex(
  JSON.stringify([0, PUBKEY, 1700000000, 1, [['nonce', String(WIN_NONCE), String(TARGET)]], 'pow on nostr']),
);
if (leadingZeroBits(MINED_ID) !== TARGET) throw new Error('delegated-pow id must reproduce');
const MINED_BITS = hexToBits(MINED_ID);

// the serialization strip: what the id commits to — and what it doesn't
const STRIP = [
  { label: '0', w: 34 },
  { label: 'pubkey', w: 96 },
  { label: 'created_at', w: 110 },
  { label: 'kind', w: 62 },
  { label: 'tags ⟵ nonce', w: 128 },
  { label: 'content', w: 96 },
];
const STRIP_X = 250;
const STRIP_Y = 150;
const STRIP_TOTAL = STRIP.reduce((a, c) => a + c.w + 10, -10);

const PHONE = { x: 220, y: 400 };
const PROVIDER = { x: 1010, y: 400 };
const HALF_W = 84;
const HALF_H = 28;

const GRID = { x: PROVIDER.x - 100, y: 462, cell: 8.5, gap: 1.8 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

const CAM_STRIP: CameraState = { x: 640, y: 240, k: 1.2 };
const CAM_WIRE: CameraState = { x: 620, y: 400, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  phoneU: ChannelRef<number>;
  batteryU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  sigGapU: ChannelRef<number>;
  sendU: ChannelRef<number>;
  grindU: ChannelRef<number>;
  returnU: ChannelRef<number>;
  signU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const phoneU = tl.channel('phoneU', 0);
  const batteryU = tl.channel('batteryU', 0);
  const stripU = tl.channel('stripU', 0);
  const sigGapU = tl.channel('sigGapU', 0);
  const sendU = tl.channel('sendU', 0);
  const grindU = tl.channel('grindU', 0);
  const returnU = tl.channel('returnU', 0);
  const signU = tl.channel('signU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the small device.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Here is a problem the spec saw coming. A relay demands serious work — say twenty bits, a million hashes. And the thing that wants to speak is a phone, on a battery, in someone’s pocket.',
  });
  tl.tween(phoneU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_WIRE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(batteryU, 1, { at: 2.6, dur: 1.6, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — what the id commits to.
  tl.caption({
    at: 7.0,
    dur: 6.4,
    text: 'The escape hatch is hiding in the serialization. Look at the six things the id is hashed over: a zero, the author, the timestamp, the kind, the tags, the content. One thing is missing — the signature.',
  });
  tl.tween(cam, CAM_STRIP, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: 7.8, dur: 2.6, ease: ease.linear });
  tl.tween(sigGapU, 1, { at: 11.0, dur: 1.2, ease: ease.enter });
  tl.hold(13.6, 0.7);

  // Beat 3 — so the work can travel.
  tl.caption({
    at: 14.3,
    dur: 5.8,
    text: 'Which means the expensive part does not need the secret key at all. The phone drafts the note, leaves it unsigned, and ships the draft to a proof of work provider — perhaps for a fee, says the spec.',
  });
  tl.tween(cam, CAM_WIRE, { at: 14.5, dur: 1.4, ease: ease.move });
  tl.tween(sendU, 1, { at: 15.4, dur: 2.0, ease: ease.linear });
  tl.hold(20.3, 0.7);

  // Beat 4 — the provider grinds.
  tl.caption({
    at: 21.0,
    dur: 6.0,
    text: 'The provider does the ugly part: spin the nonce, re-hash, repeat — datacenter electricity instead of pocket electricity. This is the same fourteen-bit id we mined in chapter two, reproduced at load.',
  });
  tl.tween(grindU, 1, { at: 21.6, dur: 3.4, ease: ease.linear });
  tl.hold(27.2, 0.7);

  // Beat 5 — the draft comes home.
  tl.caption({
    at: 27.9,
    dur: 5.8,
    text: 'Back comes the draft — same author, same words, now wearing a heavy id and its nonce tag. The provider could not have impersonated the phone: it never held the key.',
  });
  tl.tween(returnU, 1, { at: 28.6, dur: 2.0, ease: ease.linear });
  tl.hold(33.9, 0.7);

  // Beat 6 — the phone signs.
  tl.caption({
    at: 34.6,
    dur: 5.8,
    text: 'The phone does the one thing only it can do: sign. A single cheap signature over the mined id, and the note is ready — heavy enough for the strict relay, authored by the only key that matters.',
  });
  tl.tween(signU, 1, { at: 35.6, dur: 1.0, ease: ease.pop });
  tl.hold(40.6, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.3,
    dur: 5.6,
    text: 'Work is outsourceable. Authorship is not. That split — bought muscle, kept identity — falls straight out of what the id does and does not commit to. Last chapter: what all this work buys the network.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.5, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.7, dur: 1.0, ease: ease.enter });
  tl.hold(46.9, 1.2);

  return {
    tl, cam, phoneU, batteryU, stripU, sigGapU, sendU, grindU,
    returnU, signU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const phoneU = s.get(scene.phoneU);
  const batteryU = s.get(scene.batteryU);
  const stripU = s.get(scene.stripU);
  const sigGapU = s.get(scene.sigGapU);
  const sendU = s.get(scene.sendU);
  const grindU = s.get(scene.grindU);
  const returnU = s.get(scene.returnU);
  const signU = s.get(scene.signU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // the traveling draft chip
  const outbound = clamp01(sendU);
  const inbound = clamp01(returnU);
  const draftX = PHONE.x + HALF_W + 40 + (PROVIDER.x - PHONE.x - 2 * HALF_W - 120) * (inbound > 0 ? 1 - inbound : outbound);
  const draftVisible = (sendU > 0 && grindU < 1) || (returnU > 0 && returnU < 1);

  return (
    <>
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* serialization strip */}
          {stripU > 0 && (
            <g>
              <text x={STRIP_X} y={STRIP_Y - 22} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={Math.min(1, stripU * 3)}>
                what the id commits to
              </text>
              {STRIP.map((c, i) => {
                const u = clamp01(stripU * STRIP.length - i);
                if (u <= 0) return null;
                const x = STRIP_X + STRIP.slice(0, i).reduce((a, p) => a + p.w + 10, 0);
                return (
                  <g key={c.label} opacity={u}>
                    <rect x={x} y={STRIP_Y} width={c.w} height={38} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} />
                    <text x={x + c.w / 2} y={STRIP_Y + 24} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                      {c.label}
                    </text>
                  </g>
                );
              })}
              {sigGapU > 0 && (
                <g opacity={sigGapU}>
                  <rect x={STRIP_X + STRIP_TOTAL + 24} y={STRIP_Y} width={86} height={38} rx={7} fill="none" stroke={colors.NEGATIVE} strokeDasharray="5 4" />
                  <text x={STRIP_X + STRIP_TOTAL + 67} y={STRIP_Y + 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                    sig
                  </text>
                  <text x={STRIP_X + STRIP_TOTAL + 67} y={STRIP_Y + 62} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5}>
                    not hashed
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the two machines */}
          {phoneU > 0 && (
            <g>
              <ServiceNode x={PHONE.x} y={PHONE.y} kind="mobile" label="phone" sublabel="holds nsec" u={phoneU} glow={signU} />
              {batteryU > 0 && (
                <g opacity={batteryU}>
                  <rect x={PHONE.x - 44} y={PHONE.y + 44} width={88} height={14} rx={4} fill="none" stroke={colors.MUTED} />
                  <rect x={PHONE.x - 42} y={PHONE.y + 46} width={84 * 0.18} height={10} rx={3} fill={colors.NEGATIVE} opacity={0.85} />
                  <text x={PHONE.x} y={PHONE.y + 78} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                    2²⁰ hashes? not on this battery
                  </text>
                </g>
              )}
            </g>
          )}
          {sendU > 0 && (
            <g>
              <ServiceNode x={PROVIDER.x} y={PROVIDER.y} kind="server" label="pow provider" sublabel="sells hashes" u={Math.min(1, sendU * 2)} glow={grindU > 0 && grindU < 1 ? 0.8 : 0} />
              <Connection
                from={{ x: PHONE.x + HALF_W, y: PHONE.y - 10 }}
                to={{ x: PROVIDER.x - HALF_W, y: PROVIDER.y - 10 }}
                u={Math.min(1, sendU * 1.6)}
                label="unsigned draft →"
                color={colors.MUTED}
              />
            </g>
          )}
          {returnU > 0 && (
            <Connection
              from={{ x: PROVIDER.x - HALF_W, y: PROVIDER.y + 12 }}
              to={{ x: PHONE.x + HALF_W, y: PHONE.y + 12 }}
              u={Math.min(1, returnU * 1.6)}
              label="← mined draft + nonce"
              color={colors.WARM}
            />
          )}
          {draftVisible && (
            <g>
              <rect x={draftX - 46} y={PHONE.y - 64} width={92} height={30} rx={7} fill={colors.PANEL} stroke={inbound > 0 ? colors.WARM : colors.MUTED} />
              <text x={draftX} y={PHONE.y - 44} textAnchor="middle" fill={inbound > 0 ? colors.WARM : colors.MUTED} fontSize={11.5} fontFamily="monospace">
                {inbound > 0 ? 'id: 0002e0…' : 'draft · no sig'}
              </text>
            </g>
          )}

          {/* provider's grind rig */}
          {grindU > 0 && (
            <g opacity={Math.min(1, grindU * 3) * (1 - 0.6 * clamp01(signU))}>
              <BitField
                bits={MINED_BITS}
                x={GRID.x}
                y={GRID.y}
                cell={GRID.cell}
                gap={GRID.gap}
                reveal={1}
                settle={grindU}
                zeroRunU={grindU >= 1 ? 1 : 0}
                onColor={colors.WARM}
                seed={47}
              />
              {grindU >= 1 && (
                <text x={GRID.x + GRID_W / 2} y={GRID.y + GRID_W + 20} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="monospace">
                  {shortHex(MINED_ID, 10, 4)} · {TARGET} bits
                </text>
              )}
            </g>
          )}

          {/* the signature seal */}
          {signU > 0 && (
            <g opacity={signU}>
              <rect x={PHONE.x - 74} y={PHONE.y + 96} width={148} height={40} rx={9} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={PHONE.x} y={PHONE.y + 121} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                sig ← sign(id)
              </text>
              <circle cx={PHONE.x + 96} cy={PHONE.y + 116} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} />
              <path d={`M${PHONE.x + 88} ${PHONE.y + 116} l5 5 l9 -10`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} strokeLinecap="round" />
            </g>
          )}
        </g>
      </Camera>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Work is outsourceable — authorship is not
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            the id never commits to the signature, so the grinding can be bought
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-13 · delegated proof of work
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
