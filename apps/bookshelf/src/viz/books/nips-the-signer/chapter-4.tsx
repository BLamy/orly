// Nostr Implementation Possibilities №7 — The Signer, chapter 4.
// NIP-49: encrypting the secret key at rest. A password is NFKC-normalized and
// stretched by scrypt (log_n, r=8, p=1) into a 32-byte key, which XChaCha20-
// Poly1305 uses to seal the private key with a random nonce and a one-byte
// key-security AAD. The 91-byte payload — version 0x02, log_n, 16-byte salt,
// 24-byte nonce, 1 security byte, 48-byte ciphertext+tag — bech32-encodes to
// an "ncryptsec" string. The ncryptsec shown is NIP-49's own published test
// vector (password "nostr", log_n 16). The scrypt grind is illustrative; the
// byte layout and the vector string are exact.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { BitField } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// NIP-49 test vector (published in the spec).
const NCRYPTSEC =
  'ncryptsec1qgg9947rlpvqu76pj5ecreduf9jxhselq2nae2kghhvd5g7dgjtcxfqtd67p9m0w57lspw8gsq6yphnm8623nsl8xn9j4jdzz84zm3frztj3z7s35vpzmqf6ksu8r89qk5z2zxfmu5gv8th8wclt0h4p';
const LOG_N = 16;

// illustrative derived-key bits (deterministic; NOT a real scrypt output — the
// caption says so). 256 bits so the BitField reads as a 32-byte key.
const DERIVED_BITS = (() => {
  const r = mulberry32(4919);
  return Array.from({ length: 256 }, () => (r() > 0.5 ? 1 : 0));
})();

// the 91-byte payload layout (exact field sizes from NIP-49)
const FIELDS = [
  { label: 'ver', bytes: 1, note: '0x02', color: colors.MUTED },
  { label: 'log_n', bytes: 1, note: '16', color: colors.WARM },
  { label: 'salt', bytes: 16, note: 'random', color: colors.SECONDARY },
  { label: 'nonce', bytes: 24, note: 'random', color: colors.ACCENT },
  { label: 'sec', bytes: 1, note: 'AAD', color: colors.WARM },
  { label: 'ciphertext + tag', bytes: 48, note: 'XChaCha20-Poly1305', color: colors.POSITIVE },
];
const TOTAL_BYTES = FIELDS.reduce((n, f) => n + f.bytes, 0); // 91
const STRIP = { x: 120, y: 300, w: 1040, h: 46 };

const GRID = { x: 470, y: 130, cell: 12, gap: 3 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_KEY: CameraState = { x: 520, y: 250, k: 1.12 };
const CAM_STRIP: CameraState = { x: 640, y: 320, k: 1.05 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pwU: ChannelRef<number>;
  scryptU: ChannelRef<number>;
  keyU: ChannelRef<number>;
  sealU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  encodeU: ChannelRef<number>;
  costU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pwU = tl.channel('pwU', 0);
  const scryptU = tl.channel('scryptU', 0);
  const keyU = tl.channel('keyU', 0);
  const sealU = tl.channel('sealU', 0);
  const stripU = tl.channel('stripU', 0);
  const encodeU = tl.channel('encodeU', 0);
  const costU = tl.channel('costU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — sometimes the secret must be written down.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Sometimes the secret does have to be written down — backed up, or moved between devices. Writing raw nsec to disk is a disaster. So the spec encrypts it under a password first.',
  });
  tl.tween(pwU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — scrypt stretches the password.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'A password alone is too weak a key. So it is normalized and fed to scrypt — a function deliberately built to be slow and memory-hungry. The log-n knob sets how slow. Out comes a full-strength thirty-two-byte key.',
  });
  tl.tween(cam, CAM_KEY, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(scryptU, 1, { at: 7.8, dur: 2.8, ease: ease.linear });
  tl.tween(keyU, 1, { at: 10.4, dur: 1.4, ease: ease.draw });
  tl.hold(13.7, 0.7);

  // Beat 3 — XChaCha20-Poly1305 seals the nsec.
  tl.caption({
    at: 14.4,
    dur: 6.0,
    text: 'That derived key seals the real secret with an authenticated cipher, so tampering is detected. A random nonce keeps every encryption unique, and one byte records how carefully this key was handled.',
  });
  tl.tween(sealU, 1, { at: 15.0, dur: 1.8, ease: ease.move });
  tl.hold(20.4, 0.7);

  // Beat 4 — the 91-byte payload.
  tl.caption({
    at: 21.1,
    dur: 6.4,
    text: 'Everything needed to reverse this later is packed into ninety-one bytes: a version, the log-n setting, the salt, the nonce, that security byte, and the ciphertext with its authentication tag. The password is not in there — only what it takes to re-derive the key.',
  });
  tl.tween(cam, CAM_STRIP, { at: 21.3, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: 22.0, dur: 2.6, ease: ease.draw });
  tl.hold(28.2, 0.7);

  // Beat 5 — bech32 → ncryptsec.
  tl.caption({
    at: 28.9,
    dur: 5.8,
    text: 'Those bytes bech32-encode into a string that starts with ncryptsec. This exact one is the spec’s own test vector, for the password nostr. Safe to write down: without the password it is just noise.',
  });
  tl.tween(cam, CAM_WIDE, { at: 29.1, dur: 1.3, ease: ease.move });
  tl.tween(encodeU, 1, { at: 29.8, dur: 1.4, ease: ease.enter });
  tl.hold(34.7, 0.7);

  // Beat 6 — the log_n cost is the point.
  tl.caption({
    at: 35.4,
    dur: 5.8,
    text: 'And the slowness is the feature. Each password guess costs an attacker a full scrypt run, so a stolen backup resists brute force in a way a plain hash never could. The knob buys time.',
  });
  tl.tween(costU, 1, { at: 36.0, dur: 1.4, ease: ease.enter });
  tl.hold(41.2, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.9,
    dur: 5.2,
    text: 'Extension, bunker, or ncryptsec on paper — every signer is the same principle wearing different clothes. The key does the signing; the password, the wall, or the relay just decides who gets to ask.',
  });
  tl.tween(dimU, 1, { at: 42.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.3, dur: 1.0, ease: ease.enter });
  tl.hold(47.1, 1.2);

  return { tl, cam, pwU, scryptU, keyU, sealU, stripU, encodeU, costU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pwU = s.get(scene.pwU);
  const scryptU = s.get(scene.scryptU);
  const keyU = s.get(scene.keyU);
  const sealU = s.get(scene.sealU);
  const stripU = s.get(scene.stripU);
  const encodeU = s.get(scene.encodeU);
  const costU = s.get(scene.costU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  // strip byte→px scale
  const pxPerByte = STRIP.w / TOTAL_BYTES;
  let acc = 0;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* password */}
          {pwU > 0 && (
            <g opacity={pwU}>
              <rect x={140} y={150} width={170} height={38} rx={8} fill={colors.PANEL} stroke={colors.MUTED} />
              <text x={225} y={174} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                password "nostr"
              </text>
              <text x={225} y={206} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                NFKC-normalized
              </text>
            </g>
          )}

          {/* scrypt grind arrow */}
          {scryptU > 0 && (
            <g opacity={scryptU}>
              <text x={370} y={168} fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
                scrypt(log_n={LOG_N}, r=8, p=1)
              </text>
              <rect x={355} y={178} width={110 * clamp01(scryptU)} height={5} rx={2} fill={colors.WARM} opacity={0.8} />
              <text x={355} y={202} fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
                (grind — illustrative)
              </text>
            </g>
          )}

          {/* derived key bits — recede once the byte strip takes the stage */}
          {keyU > 0 && (
            <g opacity={keyU * (1 - 0.86 * clamp01(stripU * 1.6))}>
              <text x={GRID.x} y={GRID.y - 14} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                derived 32-byte key
              </text>
              <BitField bits={DERIVED_BITS} x={GRID.x} y={GRID.y} cell={GRID.cell} gap={GRID.gap} reveal={keyU} settle={keyU} onColor={colors.WARM} seed={9} />
              {sealU > 0 && stripU < 0.15 && (
                <text x={GRID.x + GRID_W / 2} y={GRID.y + GRID_W + 22} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily="monospace" opacity={sealU * (1 - clamp01(stripU * 6))}>
                  → seals nsec (XChaCha20-Poly1305)
                </text>
              )}
            </g>
          )}

          {/* the 91-byte payload strip */}
          {stripU > 0 && (
            <g opacity={stripU}>
              <text x={STRIP.x} y={STRIP.y - 68} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                91-byte payload
              </text>
              {FIELDS.map((f, i) => {
                const w = f.bytes * pxPerByte;
                const x = STRIP.x + acc * pxPerByte;
                acc += f.bytes;
                const u = clamp01(stripU * FIELDS.length - i);
                if (u <= 0) return null;
                const narrow = w < 44;
                // stagger adjacent narrow labels so ver/log_n don't collide
                const lift = i % 2 === 0 ? 16 : 34;
                return (
                  <g key={f.label} opacity={u}>
                    <rect x={x} y={STRIP.y} width={Math.max(w - 3, 2)} height={STRIP.h} rx={5} fill={colors.PANEL} stroke={f.color} strokeWidth={1.4} />
                    {narrow ? (
                      // narrow (1-byte) fields: leader up to a label above the strip
                      <>
                        <line x1={x + w / 2} y1={STRIP.y - 4} x2={x + w / 2} y2={STRIP.y - lift} stroke={f.color} strokeWidth={1} opacity={0.7} />
                        <text x={x + w / 2} y={STRIP.y - lift - 5} textAnchor="middle" fill={f.color} fontSize={11} fontFamily="monospace">
                          {f.label}
                        </text>
                      </>
                    ) : (
                      <>
                        <text x={x + w / 2} y={STRIP.y + 22} textAnchor="middle" fill={f.color} fontSize={12} fontFamily="monospace">
                          {f.label}
                        </text>
                        <text x={x + w / 2} y={STRIP.y + 38} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                          {f.note}
                        </text>
                      </>
                    )}
                    <text x={x + w / 2} y={STRIP.y + STRIP.h + 16} textAnchor="middle" fill={colors.MUTED} fontSize={narrow ? 9 : 10}>
                      {f.bytes}B
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ncryptsec string */}
          {encodeU > 0 && (
            <g opacity={encodeU}>
              <rect x={140} y={430} width={1000} height={60} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text x={160} y={456} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
                {NCRYPTSEC.slice(0, 74)}
              </text>
              <text x={160} y={478} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace">
                {NCRYPTSEC.slice(74)}
              </text>
            </g>
          )}

          {/* cost curve */}
          {costU > 0 && (
            <g opacity={costU}>
              <text x={640} y={548} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                each guess = one full scrypt run — brute force gets expensive
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Safe to write down, worthless without the password
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            scrypt → XChaCha20-Poly1305 → 91 bytes → ncryptsec
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-49 · encrypted private key export
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
