// Nostr Implementation Possibilities №6 — Proof of Work, chapter 1.
// NIP-13: difficulty is the number of leading zero bits in the NIP-01 id.
// Every digest here is real SHA-256 (toolkit sha256.ts); the two spec ids
// (002f…, 000000000e9d…) are NIP-13's own examples and their zero-bit counts
// are re-counted at module load (throws on mismatch).
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  BitField, JsonDoc, hexToBits, layoutJson, leadingZeroBits, sha256Hex, shortHex,
} from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// A plain kind-1 event and its REAL id.
// ---------------------------------------------------------------------------
const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const CREATED_AT = 1700000000;
const CONTENT = 'pow on nostr';
const SERIAL = JSON.stringify([0, PUBKEY, CREATED_AT, 1, [], CONTENT]);
const PLAIN_ID = sha256Hex(SERIAL);
const PLAIN_BITS = hexToBits(PLAIN_ID);
const PLAIN_DIFF = leadingZeroBits(PLAIN_ID);

export const EVENT = {
  id: PLAIN_ID,
  pubkey: PUBKEY,
  created_at: CREATED_AT,
  kind: 1,
  tags: [] as string[][],
  content: CONTENT,
};

const LAYOUT = layoutJson(EVENT, {
  x: 84,
  y: 150,
  fontSize: 14.5,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});

// NIP-13's own worked examples.
const HEX_TRAP = '002f'; // spec: 0000 0000 0010 1111 → 10 leading zero bits
const TRAP_BITS = hexToBits(HEX_TRAP);
const TRAP_ZEROS = (() => {
  let n = 0;
  for (const b of TRAP_BITS) { if (b) break; n++; }
  return n;
})();
if (TRAP_ZEROS !== 10) throw new Error('NIP-13 002f example must count 10 zero bits');

const SPEC_ID = '000000000e9d97a1ab09fc381030b346cdd7a142ad57e6df0b46dc9bef6c7e2d';
const SPEC_DIFF = leadingZeroBits(SPEC_ID);
if (SPEC_DIFF !== 36) throw new Error('NIP-13 36-bit example id must count 36');
const SPEC_BITS = hexToBits(SPEC_ID);

const GRID = { x: 812, y: 132, cell: 15, gap: 3 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

const CAM_JSON: CameraState = { x: 330, y: 300, k: 1.28 };
const CAM_GRID: CameraState = { x: 940, y: 300, k: 1.15 };
const CAM_TRAP: CameraState = { x: 640, y: 396, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  settleU: ChannelRef<number>;
  countU: ChannelRef<number>;
  trapU: ChannelRef<number>;
  trapBitsU: ChannelRef<number>;
  specU: ChannelRef<number>;
  specRunU: ChannelRef<number>;
  oddsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const gridU = tl.channel('gridU', 0);
  const settleU = tl.channel('settleU', 0);
  const countU = tl.channel('countU', 0);
  const trapU = tl.channel('trapU', 0);
  const trapBitsU = tl.channel('trapBitsU', 0);
  const specU = tl.channel('specU', 0);
  const specRunU = tl.channel('specRunU', 0);
  const oddsU = tl.channel('oddsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — recap: the id is a hash.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'By now you know where an event id comes from: serialize the event, hash it, and two hundred fifty six bits fall out. This chapter is about a strange question — how much does that id weigh?',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.7);

  // Beat 2 — the digest, for real.
  tl.caption({
    at: 7.2,
    dur: 5.8,
    text: 'Here is this event’s actual digest. A hash is a fair coin flipped two hundred fifty six times — every bit is heads or tails with no memory and no mercy.',
  });
  tl.tween(cam, CAM_GRID, { at: 7.4, dur: 1.5, ease: ease.move });
  tl.tween(gridU, 1, { at: 7.8, dur: 1.4, ease: ease.draw });
  tl.tween(settleU, 1, { at: 8.8, dur: 2.6, ease: ease.linear });
  tl.hold(13.0, 0.7);

  // Beat 3 — the measure: leading zeros.
  tl.caption({
    at: 13.7,
    dur: 6.2,
    text: 'The proof of work spec measures exactly one thing: read from the top left corner and count the zeros before the first one. That count is the difficulty. This ordinary id starts with almost none.',
  });
  tl.tween(countU, 1, { at: 14.6, dur: 1.8, ease: ease.move });
  tl.hold(19.9, 0.7);

  // Beat 4 — the hex trap.
  tl.caption({
    at: 20.6,
    dur: 6.4,
    text: 'One trap the spec calls out: count bits, not hex characters. The digits zero zero two f look like two zeros — but unfold each digit into its four bits and the true run is ten zero bits long.',
  });
  tl.tween(cam, CAM_TRAP, { at: 20.8, dur: 1.4, ease: ease.move });
  tl.tween(trapU, 1, { at: 21.4, dur: 0.8, ease: ease.enter });
  tl.tween(trapBitsU, 1, { at: 22.4, dur: 2.4, ease: ease.linear });
  tl.hold(27.0, 0.7);

  // Beat 5 — the spec's heavyweight id.
  tl.caption({
    at: 27.7,
    dur: 6.2,
    text: 'Now look at the id the spec shows off — the one from its own example. Thirty six zeros in a row before the first one. Nine hex digits of pure silence. That does not happen by accident.',
  });
  tl.tween(cam, CAM_GRID, { at: 27.9, dur: 1.4, ease: ease.move });
  tl.tween(trapU, 0, { at: 27.9, dur: 0.8, ease: ease.move });
  tl.tween(specU, 1, { at: 28.7, dur: 1.2, ease: ease.enter });
  tl.tween(specRunU, 1, { at: 30.0, dur: 1.6, ease: ease.move });
  tl.hold(33.9, 0.7);

  // Beat 6 — the odds.
  tl.caption({
    at: 34.6,
    dur: 6.4,
    text: 'Each extra zero halves your chances. Thirty six of them means one try in about sixty nine billion. The only way to hold an id like this is to have hashed, and hashed, and hashed again.',
  });
  tl.tween(oddsU, 1, { at: 35.6, dur: 2.2, ease: ease.move });
  tl.hold(41.0, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.7,
    dur: 6.0,
    text: 'So a run of leading zeros is a receipt for spent electricity — unfakeable, checkable by anyone in microseconds. The next chapter earns one of these ids the honest way: by mining it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 42.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.1, dur: 1.0, ease: ease.enter });
  tl.hold(47.7, 1.2);

  return {
    tl, cam, jsonU, gridU, settleU, countU, trapU, trapBitsU,
    specU, specRunU, oddsU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const gridU = s.get(scene.gridU);
  const settleU = s.get(scene.settleU);
  const countU = s.get(scene.countU);
  const trapU = s.get(scene.trapU);
  const trapBitsU = s.get(scene.trapBitsU);
  const specU = s.get(scene.specU);
  const specRunU = s.get(scene.specRunU);
  const oddsU = s.get(scene.oddsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const showingSpec = specU > 0;
  const bits = showingSpec ? SPEC_BITS : PLAIN_BITS;
  const diff = showingSpec ? SPEC_DIFF : PLAIN_DIFF;

  return (
    <>
      <Camera {...cam}>
        <g opacity={mainOp}>
          <JsonDoc layout={LAYOUT} reveal={jsonU} opacity={1 - 0.7 * clamp01(trapU + specU)} />

          {/* the digest grid — crossfades from the plain id to the spec id */}
          {gridU > 0 && (
            <g>
              <text x={GRID.x} y={GRID.y - 40} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={gridU}>
                {showingSpec ? 'NIP-13 example id — difficulty 36' : 'SHA-256(serialization)'}
              </text>
              <text x={GRID.x} y={GRID.y - 20} fill={showingSpec ? colors.WARM : colors.ACCENT} fontSize={12} fontFamily="monospace" opacity={gridU}>
                {shortHex(showingSpec ? SPEC_ID : PLAIN_ID, 14, 6)}
              </text>
              <BitField
                bits={bits}
                x={GRID.x}
                y={GRID.y}
                cell={GRID.cell}
                gap={GRID.gap}
                reveal={gridU}
                settle={showingSpec ? specU : settleU}
                zeroRunU={showingSpec ? specRunU : countU}
                onColor={showingSpec ? colors.WARM : colors.ACCENT}
                seed={showingSpec ? 21 : 6}
              />
              {/* zero-run counter */}
              {(countU > 0 || specRunU > 0) && (
                <g opacity={showingSpec ? specRunU : countU}>
                  <text x={GRID.x + GRID_W / 2} y={GRID.y + GRID_W + 32} textAnchor="middle" fill={colors.WARM} fontSize={15} fontWeight={600}>
                    {diff} leading zero {diff === 1 ? 'bit' : 'bits'}
                  </text>
                </g>
              )}
              {oddsU > 0 && showingSpec && (
                <text x={GRID.x + GRID_W / 2} y={GRID.y + GRID_W + 56} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace" opacity={oddsU}>
                  odds per hash ≈ 1 / 2³⁶ ≈ 1 / 69,000,000,000
                </text>
              )}
            </g>
          )}

          {/* the hex trap: 002f unfolds into bits */}
          {trapU > 0 && (
            <g opacity={trapU}>
              <text x={250} y={330} fill={colors.TEXT} fontSize={15} fontWeight={600}>
                count bits, not hex digits
              </text>
              {HEX_TRAP.split('').map((c, i) => (
                <g key={i}>
                  <text x={290 + i * 120} y={382} textAnchor="middle" fill={colors.SECONDARY} fontSize={26} fontFamily="monospace">
                    {c}
                  </text>
                  {TRAP_BITS.slice(i * 4, i * 4 + 4).map((b, j) => {
                    const k = i * 4 + j;
                    const u = clamp01(trapBitsU * 16 - k);
                    if (u <= 0) return null;
                    const inRun = k < TRAP_ZEROS;
                    return (
                      <g key={j} opacity={u}>
                        <rect
                          x={290 + i * 120 - 52 + j * 26}
                          y={404}
                          width={22}
                          height={22}
                          rx={3}
                          fill={b ? colors.ACCENT : colors.GRID}
                          stroke={inRun ? colors.WARM : 'none'}
                          strokeWidth={1.6}
                          opacity={b ? 0.9 : 0.4}
                        />
                        <text x={290 + i * 120 - 41 + j * 26} y={420} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily="monospace">
                          {b}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}
              {trapBitsU >= 1 && (
                <text x={640} y={470} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                  looks like 2 zeros — is actually {TRAP_ZEROS} zero bits
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Leading zeros are a receipt for work
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            impossible to fake, free to verify — difficulty = the length of the silence
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-13 · difficulty = leading zero bits of the NIP-01 id
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
