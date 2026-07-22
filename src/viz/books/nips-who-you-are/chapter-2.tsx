// Who You Are — chapter 2: the same bytes, dressed for humans (NIP-19).
// The npub shown is GENUINELY computed: a real bech32 implementation at
// module scope (BIP-173 polymod), verified against NIP-19's own test vector
// (pubkey 3bf0c63f… → npub180cvv0…). Centerpiece: the key's bits regroup
// from bytes into five-bit words and put on the bech32 alphabet, letter by
// letter; then TLV boxes pack relay hints into an nprofile; and finally an
// npub is BOUNCED off an event — hex only on the wire.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { hexToBits, shortHex } from '../../primitives';
import { PUBKEY } from './chapter-1';
import overrides from './chapter-2.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Real bech32 (BIP-173), module scope.
// ---------------------------------------------------------------------------
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}
const hrpExpand = (hrp: string) => [
  ...[...hrp].map((c) => c.charCodeAt(0) >> 5),
  0,
  ...[...hrp].map((c) => c.charCodeAt(0) & 31),
];
function convertBits(bytes: number[], from: number, to: number): number[] {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  for (const b of bytes) {
    acc = (acc << from) | b;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >> bits) & ((1 << to) - 1));
    }
  }
  if (bits > 0) out.push((acc << (to - bits)) & ((1 << to) - 1));
  return out;
}
export function bech32Encode(hrp: string, bytes: number[]): string {
  const words = convertBits(bytes, 8, 5);
  const mod = polymod([...hrpExpand(hrp), ...words, 0, 0, 0, 0, 0, 0]) ^ 1;
  const checksum = Array.from({ length: 6 }, (_, i) => (mod >> (5 * (5 - i))) & 31);
  return `${hrp}1${[...words, ...checksum].map((c) => CHARSET[c]).join('')}`;
}

const PK_BYTES = Array.from({ length: 32 }, (_, i) => parseInt(PUBKEY.slice(i * 2, i * 2 + 2), 16));
export const NPUB = bech32Encode('npub', PK_BYTES);
// NIP-19's own test vector — fail loudly if our bech32 is wrong.
if (NPUB !== 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6') {
  throw new Error(`bech32 self-test failed: ${NPUB}`);
}
const WORDS = convertBits(PK_BYTES, 8, 5); // 52 five-bit words
const NPUB_DATA = NPUB.slice(5); // after 'npub1'

const PK_BITS = hexToBits(PUBKEY);

// TLV boxes for the nprofile beat (types per NIP-19)
const TLV = [
  { t: 0, label: 'special', value: shortHex(PUBKEY, 8, 4), color: colors.WARM, note: 'the 32-byte pubkey' },
  { t: 1, label: 'relay', value: 'wss://r.x.com', color: colors.ACCENT, note: 'a relay hint' },
  { t: 1, label: 'relay', value: 'wss://djbas.sadkb.com', color: colors.ACCENT, note: 'another hint' },
];

// layout
const HEX_Y = 150;
const BITS = { x: 120, y: 210, cols: 32, cell: 9, gap: 2 }; // 8 rows of 32
const WORD_Y = 470;
const NPUB_Y = 540;
const N_SHOWN = 16; // words animated individually; the rest arrive together

const CAM_BITS: CameraState = { x: 560, y: 330, k: 1.2 };
const CAM_TLV: CameraState = { x: 700, y: 330, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  hexU: ChannelRef<number>;
  bitsU: ChannelRef<number>;
  regroupU: ChannelRef<number>;
  lettersU: ChannelRef<number>;
  npubU: ChannelRef<number>;
  checksumU: ChannelRef<number>;
  tlvU: ChannelRef<number>;
  packU: ChannelRef<number>;
  bounceU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const hexU = tl.channel('hexU', 0);
  const bitsU = tl.channel('bitsU', 0);
  const regroupU = tl.channel('regroupU', 0);
  const lettersU = tl.channel('lettersU', 0);
  const npubU = tl.channel('npubU', 0);
  const checksumU = tl.channel('checksumU', 0);
  const tlvU = tl.channel('tlvU', 0);
  const packU = tl.channel('packU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the problem: hex is for machines.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is the same key from chapter one, as sixty four hexadecimal characters. Machines love it. Nobody wants to read it over the phone. nip nineteen is the spec for dressing these bytes for humans.',
  });
  tl.tween(hexU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.hold(6.1, 0.7);

  // Beat 2 — down to bits.
  tl.caption({
    at: 6.8,
    dur: 5.4,
    text: 'Forget the hex for a moment — underneath there are just two hundred and fifty six bits. Every encoding of this key is a different way of cutting the same bit string.',
  });
  tl.tween(cam, CAM_BITS, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(bitsU, 1, { at: 7.4, dur: 2.2, ease: ease.linear });
  tl.hold(12.2, 0.7);

  // Beat 3 — regroup 8 → 5.
  tl.caption({
    at: 12.9,
    dur: 6.2,
    text: 'Bech thirty two cuts them five at a time instead of eight. Fifty two little numbers, each between zero and thirty one — exactly the size of a friendly thirty-two letter alphabet.',
  });
  tl.tween(regroupU, 1, { at: 13.6, dur: 2.8, ease: ease.linear });
  tl.hold(19.1, 0.7);

  // Beat 4 — the letters.
  tl.caption({
    at: 19.8,
    dur: 6.0,
    text: 'Map each five-bit number through that alphabet — chosen to avoid lookalike characters — and the key becomes something you can read aloud. Watch the first words take their letters.',
  });
  tl.tween(lettersU, 1, { at: 20.6, dur: 3.2, ease: ease.linear });
  tl.hold(25.8, 0.7);

  // Beat 5 — the full npub + checksum.
  tl.caption({
    at: 26.5,
    dur: 6.4,
    text: 'Add the prefix n pub — so a human knows what kind of thing they are holding — and six checksum letters at the end that catch typos. This is the real encoding of our key, computed, not typed.',
  });
  tl.tween(npubU, 1, { at: 27.2, dur: 1.6, ease: ease.draw });
  tl.tween(checksumU, 1, { at: 30.4, dur: 0.8, ease: ease.pop });
  tl.hold(32.9, 0.7);

  // Beat 6 — TLV entities.
  tl.caption({
    at: 33.6,
    dur: 6.4,
    text: 'Sometimes a bare key is not enough — you want to say where to find its owner. N profile packs typed boxes: type zero is the key, type one is a relay hint. Same alphabet, richer cargo.',
  });
  tl.tween(cam, CAM_TLV, { at: 33.8, dur: 1.4, ease: ease.move });
  tl.tween(tlvU, 1, { at: 34.6, dur: 2.2, ease: ease.linear });
  tl.tween(packU, 1, { at: 37.2, dur: 1.4, ease: ease.move });
  tl.hold(40.0, 0.7);

  // Beat 7 — hex only on the wire.
  tl.caption({
    at: 40.7,
    dur: 6.0,
    text: 'One hard rule: these coats are for people. Inside events and inside domain lookups, keys must stay raw hex — an n pub trying to enter an event gets bounced at the door.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.9, dur: 1.4, ease: ease.move });
  tl.tween(bounceU, 1, { at: 41.8, dur: 2.2, ease: ease.move });
  tl.hold(46.7, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 47.4,
    dur: 5.2,
    text: 'One key, two coats so far: a profile it signed, and an alphabet it can be spoken in. Next, a third coat — a name at a domain you already trust.',
  });
  tl.tween(dimU, 1, { at: 47.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.8, dur: 1.0, ease: ease.enter });
  tl.hold(52.6, 1.2);

  return { tl, cam, hexU, bitsU, regroupU, lettersU, npubU, checksumU, tlvU, packU, bounceU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-who-you-are/chapter-2.overrides.json',
  slug: 'books/nips-who-you-are/chapter-2',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const hexU = s.get(scene.hexU);
  const bitsU = s.get(scene.bitsU);
  const regroupU = s.get(scene.regroupU);
  const lettersU = s.get(scene.lettersU);
  const npubU = s.get(scene.npubU);
  const checksumU = s.get(scene.checksumU);
  const tlvU = s.get(scene.tlvU);
  const packU = s.get(scene.packU);
  const bounceU = s.get(scene.bounceU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const tlvPhase = tlvU > 0;
  const bitFade = tlvPhase ? 0.12 : 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* hex row */}
          {hexU > 0 && (
            <g opacity={hexU * (tlvPhase ? 0.35 : 1)}>
              <text x={120} y={HEX_Y - 22} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                hex — 64 characters
              </text>
              <text x={120} y={HEX_Y} fill={colors.WARM} fontSize={15.5} fontFamily="monospace">
                {PUBKEY.slice(0, 32)}
              </text>
              <text x={120} y={HEX_Y + 22} fill={colors.WARM} fontSize={15.5} fontFamily="monospace">
                {PUBKEY.slice(32)}
              </text>
            </g>
          )}

          {/* bit grid, 8 rows × 32 */}
          {bitsU > 0 && bitFade > 0.2 && (
            <g opacity={bitFade}>
              {PK_BITS.map((b, i) => {
                const u = clamp01(bitsU * 256 * 1.2 - i);
                if (u <= 0) return null;
                const col = i % BITS.cols;
                const row = Math.floor(i / BITS.cols);
                // regroup: columns shear into groups of five
                const group5 = Math.floor((row * BITS.cols + col) / 5);
                const shift = regroupU * (group5 % 2 === 0 ? 0 : 3);
                return (
                  <rect
                    key={i}
                    x={BITS.x + col * (BITS.cell + BITS.gap) + shift}
                    y={BITS.y + row * (BITS.cell + BITS.gap) + regroupU * (group5 % 2) * 2}
                    width={BITS.cell}
                    height={BITS.cell}
                    rx={2}
                    fill={b ? colors.ACCENT : colors.GRID}
                    opacity={u * (b ? 0.9 : 0.35)}
                  />
                );
              })}
              {regroupU > 0 && (
                <text x={490} y={BITS.y - 14} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={regroupU}>
                  …re-cut 5 bits at a time → 52 words
                </text>
              )}
            </g>
          )}

          {/* five-bit words taking letters */}
          {lettersU > 0 && !tlvPhase && (
            <g>
              {WORDS.slice(0, N_SHOWN).map((w, i) => {
                const u = clamp01(lettersU * N_SHOWN * 1.1 - i);
                if (u <= 0) return null;
                const x = 130 + i * 62;
                return (
                  <g key={i} opacity={u}>
                    <rect x={x} y={WORD_Y - 20} width={50} height={28} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={x + 25} y={WORD_Y} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                      {w}
                    </text>
                    <text x={x + 25} y={WORD_Y + 26} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily="monospace" opacity={u}>
                      {CHARSET[w]}
                    </text>
                  </g>
                );
              })}
              {lettersU >= 1 && <text x={130 + N_SHOWN * 62} y={WORD_Y + 4} fill={colors.MUTED} fontSize={14}>…</text>}
            </g>
          )}

          {/* the real npub */}
          {npubU > 0 && !tlvPhase && (
            <g opacity={npubU}>
              <text x={120} y={NPUB_Y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                npub — bech32, computed from the bits above
              </text>
              <text x={120} y={NPUB_Y + 4} fontSize={15} fontFamily="monospace">
                <tspan fill={colors.SECONDARY} fontWeight={600}>npub1</tspan>
                <tspan fill={colors.POSITIVE}>{NPUB_DATA.slice(0, Math.max(0, Math.round(npubU * (NPUB_DATA.length - 6))))}</tspan>
              </text>
              {checksumU > 0 && (
                <g opacity={checksumU}>
                  <text x={120 + (5 + NPUB_DATA.length - 6) * 9.05} y={NPUB_Y + 4} fill={colors.WARM} fontSize={15} fontFamily="monospace" fontWeight={600}>
                    {NPUB.slice(-6)}
                  </text>
                  <text x={120 + (5 + NPUB_DATA.length - 6) * 9.05} y={NPUB_Y + 26} fill={colors.WARM} fontSize={11}>
                    checksum
                  </text>
                </g>
              )}
            </g>
          )}

          {/* TLV / nprofile */}
          {tlvU > 0 && (
            <g>
              <text x={330} y={196} fill={colors.MUTED} fontSize={13} fontFamily="monospace" opacity={tlvU}>
                nprofile — typed boxes, then the same alphabet
              </text>
              {TLV.map((t, i) => {
                const u = clamp01(tlvU * TLV.length - i);
                if (u <= 0) return null;
                const x = 330 + i * 250 - packU * i * 46;
                return (
                  <g key={i} opacity={u}>
                    <rect x={x} y={230} width={224 - packU * 40} height={64} rx={9} fill={colors.PANEL} stroke={t.color} />
                    <text x={x + 12} y={252} fill={t.color} fontSize={12} fontFamily="monospace">
                      type {t.t} · {t.label}
                    </text>
                    <text x={x + 12} y={276} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                      {t.value}
                    </text>
                  </g>
                );
              })}
              {packU > 0.6 && (
                <text x={330} y={340} fill={colors.SECONDARY} fontSize={14} fontFamily="monospace" opacity={(packU - 0.6) / 0.4}>
                  nprofile1qqs80cvv0…  — key + where to look
                </text>
              )}
            </g>
          )}

          {/* the bounce: npub cannot enter an event */}
          {bounceU > 0 && (
            <g>
              <rect x={820} y={420} width={330} height={110} rx={10} fill={colors.PANEL} stroke={colors.GRID} opacity={Math.min(1, bounceU * 2)} />
              <text x={838} y={448} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={Math.min(1, bounceU * 2)}>
                {'{ "pubkey": _______ , … }'}
              </text>
              <text x={838} y={478} fill={colors.WARM} fontSize={12} fontFamily="monospace" opacity={clamp01(bounceU * 3 - 2)}>
                {shortHex(PUBKEY, 12, 6)} ✓ hex
              </text>
              {(() => {
                // npub flies toward the slot, bounces back
                const t = clamp01(bounceU);
                const fwd = t < 0.5 ? t / 0.5 : 1 - (t - 0.5) / 0.5 * 0.55;
                const x = 430 + (838 - 430) * fwd;
                const y = 560 - 60 * Math.sin(Math.PI * fwd);
                return (
                  <g>
                    <text x={x} y={y} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace" opacity={0.9}>
                      npub180cvv0…
                    </text>
                    {t > 0.45 && t < 0.75 && (
                      <text x={990} y={545} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={1 - Math.abs(t - 0.6) * 6}>
                        ✕ not on the wire
                      </text>
                    )}
                  </g>
                );
              })()}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Encodings are coats, not identities
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            npub for humans · TLV for context · hex on the wire
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-19 · bech32 (BIP-173) · nprofile TLV 0/1/2/3
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter2() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
