// Sealed and Wrapped — chapter 2: one shared secret (NIP-44 conversation key).
// Alice and Bob each walk the secp256k1 curve — a·(b·G) and b·(a·G) land on
// the SAME point (drawn over ℝ; the real group is over a prime field — the
// caption owns that). Its x-coordinate feeds HKDF-extract with the salt
// 'nip44-v2', and the conversation key settles as a BitField — computed with
// a REAL HMAC-SHA256 / HKDF at module scope (the shared x itself is
// illustrative, since honest scalar multiplication is out of scope for a
// picture). Two grids, one for each side, settle to an identical pattern.
import { CAMERA_HOME, Camera, MathLabel, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { BitField, EcCurve, ecPlot, hexToBits, sha256Bytes, shortHex } from '../../primitives';
import overrides from './chapter-2.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Real HMAC-SHA256 and HKDF (RFC 5869), module scope. Exported for chapter 3.
// ---------------------------------------------------------------------------
const utf8 = (s: string) => new TextEncoder().encode(s);
const concat = (...arrs: Uint8Array[]) => {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
};

export function hmacSha256(key: Uint8Array, msg: Uint8Array): Uint8Array {
  const BLOCK = 64;
  let k = key.length > BLOCK ? sha256Bytes(key) : key;
  const kp = new Uint8Array(BLOCK);
  kp.set(k);
  const ipad = kp.map((b) => b ^ 0x36);
  const opad = kp.map((b) => b ^ 0x5c);
  return sha256Bytes(concat(opad, sha256Bytes(concat(ipad, msg))));
}

/** HKDF-extract: PRK = HMAC(salt, ikm). */
export const hkdfExtract = (salt: Uint8Array, ikm: Uint8Array) => hmacSha256(salt, ikm);

/** HKDF-expand to `len` bytes. */
export function hkdfExpand(prk: Uint8Array, info: Uint8Array, len: number): Uint8Array {
  const out: Uint8Array[] = [];
  let t: Uint8Array = new Uint8Array(0);
  for (let i = 1; out.reduce((n, a) => n + a.length, 0) < len; i++) {
    t = hmacSha256(prk, concat(t, info, new Uint8Array([i])));
    out.push(t);
  }
  return concat(...out).slice(0, len);
}

// hmac self-test (RFC 4231 test case 2: key "Jefe", data "what do ya want
// for nothing?") — fail loudly if the implementation is wrong.
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
if (hex(hmacSha256(utf8('Jefe'), utf8('what do ya want for nothing?'))) !==
    '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843') {
  throw new Error('hmac-sha256 self-test failed');
}

// Illustrative shared x (a real ECDH needs field arithmetic; the caption is
// honest about this). Everything DOWNSTREAM of it is computed for real.
export const SHARED_X = sha256Bytes(utf8('nip44 demo shared point x'));
export const CONV_KEY = hkdfExtract(utf8('nip44-v2'), SHARED_X);
export const CONV_KEY_HEX = hex(CONV_KEY);
const CONV_BITS = hexToBits(CONV_KEY_HEX);

// ---------------------------------------------------------------------------
// Stage layout
// ---------------------------------------------------------------------------
const CURVE_VIEW = { x: 350, y: 70, w: 600, h: 340 };
const P = ecPlot(CURVE_VIEW);
// hop chains: Alice (top route) and Bob (bottom route) both end at MEET_X
const MEET_X = 2.6;
const A_HOPS = [-1.72, -0.4, 1.3, MEET_X];
const B_HOPS = [-1.72, 0.7, 1.9, MEET_X];

const GRID_A = { x: 150, y: 430, cell: 8, gap: 2 };
const GRID_B = { x: 780, y: 430, cell: 8, gap: 2 };
const GRID_W = 16 * 10 - 2;

const CAM_CURVE: CameraState = { x: 650, y: 260, k: 1.2 };
const CAM_GRIDS: CameraState = { x: 640, y: 430, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  curveU: ChannelRef<number>;
  keysU: ChannelRef<number>;
  aHopU: ChannelRef<number>;
  bHopU: ChannelRef<number>;
  meetU: ChannelRef<number>;
  xU: ChannelRef<number>;
  hkdfU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  settleU: ChannelRef<number>;
  sameU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const curveU = tl.channel('curveU', 0);
  const keysU = tl.channel('keysU', 0);
  const aHopU = tl.channel('aHopU', 0);
  const bHopU = tl.channel('bHopU', 0);
  const meetU = tl.channel('meetU', 0);
  const xU = tl.channel('xU', 0);
  const hkdfU = tl.channel('hkdfU', 0);
  const gridU = tl.channel('gridU', 0);
  const settleU = tl.channel('settleU', 0);
  const sameU = tl.channel('sameU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the goal.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Before anything can be sealed, Alice and Bob need one secret they both know — without ever sending it. The trick lives on the same curve their identities do.',
  });
  tl.tween(curveU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_CURVE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — two private walks.
  tl.caption({
    at: 6.8,
    dur: 6.4,
    text: 'Alice takes Bob’s public point and walks it by her secret number. Bob takes Alice’s public point and walks it by his. Different routes — we draw the smooth real picture of a curve that truly lives over a prime field.',
  });
  tl.tween(keysU, 1, { at: 7.0, dur: 0.7, ease: ease.enter });
  tl.tween(aHopU, 1, { at: 7.8, dur: 2.4, ease: ease.linear });
  tl.tween(bHopU, 1, { at: 8.6, dur: 2.4, ease: ease.linear });
  tl.hold(13.4, 0.7);

  // Beat 3 — they meet.
  tl.caption({
    at: 14.1,
    dur: 5.8,
    text: 'And the walks land on the very same point — because a times b times G is b times a times G. That meeting point is the Diffie–Hellman shared secret, and no listener can reach it.',
  });
  tl.tween(meetU, 1, { at: 15.0, dur: 0.7, ease: ease.pop });
  tl.hold(20.1, 0.7);

  // Beat 4 — extract, don't use raw.
  tl.caption({
    at: 20.8,
    dur: 6.2,
    text: 'Nip forty-four refuses to use that point raw — the old kind four did, and paid for it. Instead the point’s x coordinate goes through H K D F extract, salted with the protocol name itself.',
  });
  tl.tween(cam, CAM_GRIDS, { at: 21.2, dur: 1.5, ease: ease.move });
  // the name/equation labels sit above the new frame — set them aside
  tl.tween(keysU, 0, { at: 21.2, dur: 0.8, ease: ease.move });
  tl.tween(xU, 1, { at: 21.6, dur: 1.2, ease: ease.move });
  tl.tween(hkdfU, 1, { at: 23.0, dur: 1.0, ease: ease.enter });
  tl.hold(27.2, 0.7);

  // Beat 5 — the conversation key settles, twice.
  tl.caption({
    at: 27.9,
    dur: 6.4,
    text: 'Out comes the conversation key. Alice derives it on her machine. Bob derives it on his. These bits are a real H K D F output, computed live — watch both sides settle.',
  });
  tl.tween(gridU, 1, { at: 28.3, dur: 1.2, ease: ease.draw });
  tl.tween(settleU, 1, { at: 29.2, dur: 2.8, ease: ease.linear });
  tl.hold(34.5, 0.7);

  // Beat 6 — identical.
  tl.caption({
    at: 35.2,
    dur: 5.6,
    text: 'Two machines, zero messages about the key itself — and not a single bit differs. One symmetric secret per pair of people, reused for every direction of their conversation.',
  });
  tl.tween(sameU, 1, { at: 36.2, dur: 0.8, ease: ease.pop });
  tl.hold(40.8, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.5,
    dur: 5.6,
    text: 'This is the conversation key: derived, never sent, identical on both ends. Next chapter, it stops being a key and becomes a key factory — one fresh set per message.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.9, dur: 1.0, ease: ease.enter });
  tl.hold(47.1, 1.2);

  return {
    tl, cam, curveU, keysU, aHopU, bHopU,
    meetU, xU, hkdfU, gridU, settleU, sameU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-sealed-and-wrapped/chapter-2.overrides.json',
  slug: 'books/nips-sealed-and-wrapped/chapter-2',
};

const hopPath = (hops: number[], i: number, u: number, sign: 1 | -1, lift: number) => {
  const ax = P.sx(hops[i - 1]);
  const ay = P.sy(sign * P.curveY(hops[i - 1]));
  const bx = P.sx(hops[i]);
  const by = P.sy(sign * P.curveY(hops[i]));
  const mx = (ax + bx) / 2;
  const my = Math.min(ay, by) - lift;
  return `M${ax},${ay} Q${mx},${my} ${ax + (bx - ax) * u},${ay + (by - ay) * u}`;
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const curveU = s.get(scene.curveU);
  const keysU = s.get(scene.keysU);
  const aHopU = s.get(scene.aHopU);
  const bHopU = s.get(scene.bHopU);
  const meetU = s.get(scene.meetU);
  const xU = s.get(scene.xU);
  const hkdfU = s.get(scene.hkdfU);
  const gridU = s.get(scene.gridU);
  const settleU = s.get(scene.settleU);
  const sameU = s.get(scene.sameU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const meet = { x: P.sx(MEET_X), y: P.sy(P.curveY(MEET_X)) };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <EcCurve view={CURVE_VIEW} reveal={curveU} />

          {keysU > 0 && (
            <g opacity={keysU}>
              <text x={CURVE_VIEW.x - 190} y={150} fill={colors.ACCENT} fontSize={15} fontWeight={600}>
                Alice
              </text>
              <MathLabel tex={'a \\cdot (b \\cdot G)'} x={CURVE_VIEW.x - 190} y={168} opacity={keysU} />
              <text x={CURVE_VIEW.x + CURVE_VIEW.w + 60} y={150} fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                Bob
              </text>
              <MathLabel tex={'b \\cdot (a \\cdot G)'} x={CURVE_VIEW.x + CURVE_VIEW.w + 60} y={168} opacity={keysU} />
            </g>
          )}

          {/* Alice hops along the upper branch, Bob along the lower */}
          {A_HOPS.map((_, i) => {
            if (i === 0) return null;
            const u = clamp01(aHopU * (A_HOPS.length - 1) - (i - 1));
            if (u <= 0) return null;
            return <path key={`a${i}`} d={hopPath(A_HOPS, i, u, 1, 46)} fill="none" stroke={colors.ACCENT} strokeWidth={1.8} opacity={0.85} />;
          })}
          {B_HOPS.map((_, i) => {
            if (i === 0) return null;
            const u = clamp01(bHopU * (B_HOPS.length - 1) - (i - 1));
            if (u <= 0) return null;
            return <path key={`b${i}`} d={hopPath(B_HOPS, i, u, -1, 46)} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} opacity={0.85} />;
          })}

          {/* the meeting point (Bob's route mirrors up on the last hop) */}
          {meetU > 0 && (
            <g opacity={meetU}>
              <line x1={P.sx(MEET_X)} y1={P.sy(-P.curveY(MEET_X))} x2={meet.x} y2={meet.y} stroke={colors.POSITIVE} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.7} />
              <circle cx={meet.x} cy={meet.y} r={10} fill={colors.WARM} />
              <text x={meet.x - 16} y={meet.y - 16} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={600}>
                the shared point
              </text>
            </g>
          )}

          {/* x-coordinate → HKDF-extract */}
          {xU > 0 && (
            <g opacity={xU}>
              <line x1={meet.x} y1={meet.y} x2={meet.x} y2={392} stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="5 4" />
              <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="monospace">
                shared_x = {shortHex(hex(SHARED_X), 8, 4)} (illustrative point, real pipeline from here)
              </text>
            </g>
          )}
          {hkdfU > 0 && (
            <g opacity={hkdfU}>
              <rect x={470} y={425} width={340} height={36} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={640} y={448} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                hkdf_extract(salt "nip44-v2", shared_x)
              </text>
            </g>
          )}

          {/* the two settling grids */}
          {gridU > 0 && (
            <g>
              <text x={GRID_A.x} y={GRID_A.y - 14} fill={colors.ACCENT} fontSize={13} opacity={gridU}>
                derived on Alice’s machine
              </text>
              <BitField bits={CONV_BITS} x={GRID_A.x} y={GRID_A.y} cell={GRID_A.cell} gap={GRID_A.gap} reveal={gridU} settle={settleU} seed={21} />
              <text x={GRID_B.x} y={GRID_B.y - 14} fill={colors.POSITIVE} fontSize={13} opacity={gridU}>
                derived on Bob’s machine
              </text>
              <BitField bits={CONV_BITS} x={GRID_B.x} y={GRID_B.y} cell={GRID_B.cell} gap={GRID_B.gap} reveal={gridU} settle={settleU} seed={22} />
              {settleU >= 1 && (
                <text x={640} y={530} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={gridU}>
                  conversation_key = {shortHex(CONV_KEY_HEX, 10, 6)}
                </text>
              )}
            </g>
          )}
          {sameU > 0 && (
            <g opacity={sameU}>
              <text x={640} y={558} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
                0 of 256 bits differ
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One secret, never sent
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            ECDH meets in the middle · HKDF-extract, salted "nip44-v2"
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-44 v2 · conversation_key = hkdf_extract(salt, shared_x)
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
