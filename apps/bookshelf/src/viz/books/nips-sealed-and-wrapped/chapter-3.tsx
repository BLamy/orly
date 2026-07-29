// Sealed and Wrapped — chapter 3: keys for one message (NIP-44 v2 pipeline).
// The conversation key becomes a key FACTORY: a fresh 32-byte nonce feeds
// HKDF-expand, and the 76-byte ribbon it emits is cut into chacha_key(32) /
// chacha_nonce(12) / hmac_key(32) — all REAL bytes (chapter 2's HKDF).
// The plaintext is padded, streamed through the cipher (keystream shown as a
// BitField XOR — a stand-in stream, the captions own it), MAC'd over
// nonce||ciphertext, assembled [0x02 | nonce | ciphertext | mac], base64'd,
// and flown into the event's content slot.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, sha256Bytes, shortHex } from '../../primitives';
import { CONV_KEY, hkdfExpand, hmacSha256 } from './chapter-2';
import overrides from './chapter-3.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Real message-key derivation (spec: HKDF-expand, PRK=conversation_key,
// info=nonce, L=76 → chacha_key | chacha_nonce | hmac_key).
// ---------------------------------------------------------------------------
const utf8 = (s: string) => new TextEncoder().encode(s);
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

const NONCE = sha256Bytes(utf8('nip44 demo message nonce')); // fixed "random" nonce, deterministic for the scene
const RIBBON = hkdfExpand(CONV_KEY, NONCE, 76);
const CHACHA_KEY = RIBBON.slice(0, 32);
const CHACHA_NONCE = RIBBON.slice(32, 44);
const HMAC_KEY = RIBBON.slice(44, 76);

const PLAINTEXT = 'see you at 7?';
// padded length per calc_padded_len: 13 bytes → 32; with 2-byte length prefix
const PADDED_LEN = 32;
// stand-in keystream + ciphertext (deterministic; a real ChaCha20 is out of
// scope for a picture — the structure and sizes are exact)
const KEYSTREAM = sha256Bytes(CHACHA_KEY);
const PLAIN_BYTES = (() => {
  const p = new Uint8Array(PADDED_LEN + 2);
  p[0] = 0;
  p[1] = PLAINTEXT.length;
  p.set(utf8(PLAINTEXT), 2);
  return p;
})();
const CIPHER_BYTES = PLAIN_BYTES.map((b, i) => b ^ KEYSTREAM[i % 32]);
const MAC = hmacSha256(HMAC_KEY, new Uint8Array([...NONCE, ...CIPHER_BYTES]));

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const b64ish = (b: Uint8Array, n: number) => [...b.slice(0, n)].map((x) => B64[x % 64]).join('');
const PAYLOAD_B64 = `Ag${b64ish(NONCE, 10)}…${b64ish(MAC, 6)}`;

export const WRAPPED_EVENT = {
  kind: 14,
  content: PAYLOAD_B64,
  tags: [['p', '6b0d4a8c…']],
};
const LAYOUT = layoutJson(WRAPPED_EVENT, { x: 860, y: 420, fontSize: 13 });

// ---------------------------------------------------------------------------
// Layout — the factory line, top to bottom.
// ---------------------------------------------------------------------------
const CONV = { x: 90, y: 120, w: 230, h: 40 };
const NONCE_BOX = { x: 360, y: 120, w: 230, h: 40 };
const RIB = { x: 150, y: 240, w: 760, h: 34 }; // the 76-byte ribbon
const CUTS = [
  { from: 0, to: 32, label: 'chacha_key · 32', color: colors.ACCENT },
  { from: 32, to: 44, label: 'nonce · 12', color: colors.SECONDARY },
  { from: 44, to: 76, label: 'hmac_key · 32', color: colors.WARM },
];
const STREAM_Y = 360;
const PAY = { x: 90, y: 480, h: 40 };
const PAY_CELLS = [
  { label: '0x02', w: 52, color: colors.MUTED, note: 'version' },
  { label: b64ish(NONCE, 8), w: 130, color: colors.SECONDARY, note: 'nonce · 32' },
  { label: b64ish(CIPHER_BYTES, 10), w: 170, color: colors.ACCENT, note: 'ciphertext' },
  { label: shortHex(hex(MAC), 6, 0), w: 120, color: colors.WARM, note: 'mac · 32' },
];

const CAM_TOP: CameraState = { x: 560, y: 240, k: 1.2 };
const CAM_STREAM: CameraState = { x: 560, y: 380, k: 1.2 };
const CAM_PAY: CameraState = { x: 640, y: 460, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  inU: ChannelRef<number>;
  ribbonU: ChannelRef<number>;
  cutU: ChannelRef<number>;
  padU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  macU: ChannelRef<number>;
  payU: ChannelRef<number>;
  b64U: ChannelRef<number>;
  jsonU: ChannelRef<number>;
  flyU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const inU = tl.channel('inU', 0);
  const ribbonU = tl.channel('ribbonU', 0);
  const cutU = tl.channel('cutU', 0);
  const padU = tl.channel('padU', 0);
  const streamU = tl.channel('streamU', 0);
  const macU = tl.channel('macU', 0);
  const payU = tl.channel('payU', 0);
  const b64U = tl.channel('b64U', 0);
  const jsonU = tl.channel('jsonU', 0);
  const flyU = tl.channel('flyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the factory inputs.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'One conversation key for years of messages would be a single point of failure. So nip forty-four treats it as a factory: for every message, a fresh thirty-two byte nonce walks in the door.',
  });
  tl.tween(inU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_TOP, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.7);

  // Beat 2 — the ribbon.
  tl.caption({
    at: 7.2,
    dur: 6.2,
    text: 'H K D F expand mixes the two and emits exactly seventy-six bytes. These are the real bytes — derived live from the previous chapter’s conversation key.',
  });
  tl.tween(ribbonU, 1, { at: 8.0, dur: 1.8, ease: ease.draw });
  tl.hold(13.4, 0.7);

  // Beat 3 — the three cuts.
  tl.caption({
    at: 14.1,
    dur: 6.2,
    text: 'The ribbon is cut three ways: a cipher key, a cipher nonce, and a separate authentication key. Three jobs, three keys — never one key doing double duty.',
  });
  tl.tween(cutU, 1, { at: 15.0, dur: 2.2, ease: ease.move });
  tl.hold(20.3, 0.7);

  // Beat 4 — pad, then stream.
  tl.caption({
    at: 21.0,
    dur: 6.4,
    text: 'The message — see you at seven, question mark — is first padded to a fixed bucket, then streamed through cha cha twenty. We show the keystream flipping bits; the real cipher differs only in which bits.',
  });
  tl.tween(cam, CAM_STREAM, { at: 21.2, dur: 1.4, ease: ease.move });
  tl.tween(padU, 1, { at: 21.8, dur: 1.0, ease: ease.enter });
  tl.tween(streamU, 1, { at: 23.0, dur: 3.2, ease: ease.linear });
  tl.hold(27.6, 0.7);

  // Beat 5 — the MAC.
  tl.caption({
    at: 28.3,
    dur: 6.0,
    text: 'Then the authentication key signs off — a keyed authentication hash computed over the nonce and the ciphertext together, so neither can be swapped without the whole seal failing.',
  });
  tl.tween(macU, 1, { at: 29.2, dur: 1.2, ease: ease.enter });
  tl.hold(34.5, 0.7);

  // Beat 6 — assembly.
  tl.caption({
    at: 35.2,
    dur: 6.2,
    text: 'Now the payload snaps together in a fixed order: a version byte of two, the nonce, the ciphertext, the mac. Ninety-nine bytes minimum, even for a one-letter message.',
  });
  tl.tween(cam, CAM_PAY, { at: 35.4, dur: 1.4, ease: ease.move });
  tl.tween(payU, 1, { at: 36.0, dur: 2.6, ease: ease.linear });
  tl.hold(41.6, 0.7);

  // Beat 7 — base64 into the event.
  tl.caption({
    at: 42.3,
    dur: 6.0,
    text: 'Base sixty-four turns the bytes into text, and the text drops into an event’s content field — ready for the sealing and wrapping the last chapter performs.',
  });
  tl.tween(b64U, 1, { at: 42.7, dur: 0.8, ease: ease.enter });
  tl.tween(jsonU, 1, { at: 43.3, dur: 1.2, ease: ease.draw });
  tl.tween(flyU, 1, { at: 44.6, dur: 1.4, ease: ease.move });
  tl.hold(48.5, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 49.2,
    dur: 5.4,
    text: 'Fresh keys per message, separate keys per job, authentication over everything that matters. That is the sealed letter. What is still showing is the envelope — next chapter hides it.',
  });
  tl.tween(dimU, 1, { at: 49.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.6, dur: 1.0, ease: ease.enter });
  tl.hold(54.8, 1.2);

  return { tl, cam, inU, ribbonU, cutU, padU, streamU, macU, payU, b64U, jsonU, flyU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-sealed-and-wrapped/chapter-3.overrides.json',
  slug: 'books/nips-sealed-and-wrapped/chapter-3',
};

// byte-strip renderer: n cells colored by segment
function ByteStrip({ x, y, w, h, n, colorAt, u }: { x: number; y: number; w: number; h: number; n: number; colorAt: (i: number) => string; u: number }) {
  const cw = w / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cu = clamp01(u * n * 1.1 - i);
        if (cu <= 0) return null;
        return (
          <rect key={i} x={x + i * cw} y={y} width={Math.max(1, cw - 1.5)} height={h} rx={2} fill={colorAt(i)} opacity={0.35 + 0.5 * cu} />
        );
      })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const inU = s.get(scene.inU);
  const ribbonU = s.get(scene.ribbonU);
  const cutU = s.get(scene.cutU);
  const padU = s.get(scene.padU);
  const streamU = s.get(scene.streamU);
  const macU = s.get(scene.macU);
  const payU = s.get(scene.payU);
  const b64U = s.get(scene.b64U);
  const jsonU = s.get(scene.jsonU);
  const flyU = s.get(scene.flyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const streamN = 34;
  const contentAnchor = LAYOUT.anchor('content');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* inputs */}
          {inU > 0 && (
            <g opacity={inU}>
              <rect x={CONV.x} y={CONV.y} width={CONV.w} height={CONV.h} rx={9} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={CONV.x + CONV.w / 2} y={CONV.y + 25} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                conversation_key
              </text>
              <rect x={NONCE_BOX.x} y={NONCE_BOX.y} width={NONCE_BOX.w} height={NONCE_BOX.h} rx={9} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={NONCE_BOX.x + NONCE_BOX.w / 2} y={NONCE_BOX.y + 25} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                nonce (fresh, 32 B)
              </text>
              <text x={640} y={145} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                → hkdf_expand(conversation_key, nonce, 76)
              </text>
            </g>
          )}

          {/* the 76-byte ribbon */}
          {ribbonU > 0 && (
            <g>
              {[CONV, NONCE_BOX].map((b, i) => (
                <line key={i} x1={b.x + b.w / 2} y1={b.y + b.h} x2={RIB.x + RIB.w * (0.25 + i * 0.4)} y2={RIB.y} stroke={colors.GRID} strokeWidth={1.2} opacity={ribbonU * 0.8} />
              ))}
              <ByteStrip
                x={RIB.x}
                y={RIB.y}
                w={RIB.w}
                h={RIB.h}
                n={76}
                u={ribbonU}
                colorAt={(i) => {
                  if (cutU <= 0) return colors.MUTED;
                  const seg = CUTS.find((c) => i >= c.from && i < c.to)!;
                  return seg.color;
                }}
              />
              <text x={RIB.x} y={RIB.y - 10} fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={ribbonU}>
                76 real bytes: {shortHex(hex(RIBBON), 12, 6)}
              </text>
              {/* cut markers + labels */}
              {cutU > 0 &&
                CUTS.map((c, i) => {
                  const u = clamp01(cutU * CUTS.length - i);
                  if (u <= 0) return null;
                  const x0 = RIB.x + (RIB.w * c.from) / 76;
                  const x1 = RIB.x + (RIB.w * c.to) / 76;
                  return (
                    <g key={c.label} opacity={u}>
                      <line x1={x1} y1={RIB.y - 6} x2={x1} y2={RIB.y + RIB.h + 6} stroke={colors.TEXT} strokeWidth={i < 2 ? 1.5 : 0} />
                      <text x={(x0 + x1) / 2} y={RIB.y + RIB.h + 22} textAnchor="middle" fill={c.color} fontSize={12} fontFamily="monospace">
                        {c.label}
                      </text>
                    </g>
                  );
                })}
            </g>
          )}

          {/* pad + stream */}
          {padU > 0 && (
            <g opacity={padU}>
              <text x={90} y={STREAM_Y - 16} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
                "{PLAINTEXT}"
              </text>
              <text x={250} y={STREAM_Y - 16} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                → 2-byte length + padding → {PADDED_LEN + 2} bytes
              </text>
            </g>
          )}
          {padU > 0 && (
            <g>
              {Array.from({ length: streamN }, (_, i) => {
                const done = clamp01(streamU * streamN - i);
                const cw = 24;
                const x = 90 + i * cw;
                const plain = i < 2 ? (i === 1 ? String(PLAINTEXT.length) : '·') : i - 2 < PLAINTEXT.length ? PLAINTEXT[i - 2] : '·';
                return (
                  <g key={i}>
                    <rect x={x} y={STREAM_Y} width={cw - 3} height={30} rx={4}
                      fill={done >= 1 ? colors.ACCENT : colors.PANEL}
                      stroke={done >= 1 ? colors.ACCENT : colors.GRID}
                      opacity={done >= 1 ? 0.85 : 0.8}
                    />
                    <text x={x + cw / 2 - 1.5} y={STREAM_Y + 20} textAnchor="middle" fontSize={12} fontFamily="monospace"
                      fill={done >= 1 ? colors.BG : colors.TEXT}>
                      {done >= 1 ? B64[CIPHER_BYTES[i] % 64] : plain}
                    </text>
                  </g>
                );
              })}
              {streamU > 0 && streamU < 1 && (
                <g>
                  <circle cx={90 + clamp01(streamU) * streamN * 24} cy={STREAM_Y - 14} r={6} fill={colors.SECONDARY} />
                  <text x={90 + clamp01(streamU) * streamN * 24 + 12} y={STREAM_Y - 9} fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">
                    keystream
                  </text>
                </g>
              )}
            </g>
          )}

          {/* mac */}
          {macU > 0 && (
            <g opacity={macU}>
              <path d={`M120,${STREAM_Y + 40} h700`} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="4 4" fill="none" />
              <text x={640} y={STREAM_Y + 62} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                mac = hmac_sha256(hmac_key, nonce ‖ ciphertext) = {shortHex(hex(MAC), 8, 4)}
              </text>
            </g>
          )}

          {/* payload assembly */}
          {payU > 0 && (
            <g>
              {(() => {
                let px = PAY.x;
                return PAY_CELLS.map((c, i) => {
                  const u = clamp01(payU * PAY_CELLS.length - i);
                  const cell = (
                    <g key={c.label + i} opacity={Math.max(0.001, u)}>
                      <rect x={px} y={PAY.y} width={c.w} height={PAY.h} rx={7} fill={colors.PANEL} stroke={c.color} opacity={0.5 + 0.5 * u} />
                      <text x={px + c.w / 2} y={PAY.y + 20} textAnchor="middle" fill={c.color} fontSize={11} fontFamily="monospace">
                        {c.label}
                      </text>
                      <text x={px + c.w / 2} y={PAY.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={9}>
                        {c.note}
                      </text>
                    </g>
                  );
                  px += c.w + 8;
                  return cell;
                });
              })()}
              <text x={PAY.x} y={PAY.y - 12} fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={payU}>
                payload = version ‖ nonce ‖ ciphertext ‖ mac (min 99 bytes)
              </text>
            </g>
          )}

          {/* base64 + event */}
          {b64U > 0 && (
            <text x={PAY.x} y={PAY.y + 68} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace" opacity={b64U}>
              base64 → "{PAYLOAD_B64}"
            </text>
          )}
          {jsonU > 0 && <JsonDoc layout={LAYOUT} reveal={jsonU} hidden={flyU < 1 ? ['content'] : undefined} />}
          <TokenFlight
            from={{ x: PAY.x + 180, y: PAY.y + 63 }}
            to={{ x: contentAnchor.cx, y: contentAnchor.cy + 4 }}
            u={flyU}
            text={PAYLOAD_B64.slice(0, 14) + '…'}
            fill={colors.POSITIVE}
            fontSize={11}
            lift={60}
            holdAtEnd={false}
          />
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A fresh set of keys for every message
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            expand · cut · pad · stream · authenticate · assemble
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-44 v2 · 0x02 ‖ nonce ‖ ciphertext ‖ mac · base64
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter3() {
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
