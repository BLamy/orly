// Nostr keys — from a secret number to a Schnorr signature (NIP-01 crypto).
// One persistent object: the secret d starts as a number, hops along the
// secp256k1 curve to become the pubkey P = d·G, and finally anchors the
// verify equation. The message digest is a REAL SHA-256; the curve is the
// standard ℝ picture of y² = x³ + 7 (the real group lives over a prime
// field — the caption owns that).
import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';
import { hexToBits, sha256Hex } from '../../primitives';

export const MSG = 'GM nostr';
export const MSG_HEX = sha256Hex(MSG);
export const MSG_BITS = hexToBits(MSG_HEX);

export const CURVE_VIEW = { x: 430, y: 90, w: 700, h: 420 };
// illustrative hop chain on the real curve: G, then successive "doublings"
export const HOPS = [-1.72, -0.9, 0.4, 1.5, 2.3, 2.85];

export const D_LINE = { x: 90, y: 190, w: 240 };
export const DIGEST = { x: 120, y: 330, cell: 9, gap: 2 };

const CAM_CURVE: CameraState = { x: 760, y: 300, k: 1.15 };
const CAM_SIGN: CameraState = { x: 560, y: 380, k: 1.1 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  dU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  hopU: ChannelRef<number>;
  pU: ChannelRef<number>;
  oneWayU: ChannelRef<number>;
  msgU: ChannelRef<number>;
  settleU: ChannelRef<number>;
  sigU: ChannelRef<number>;
  verifyU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dU = tl.channel('dU', 0);
  const curveU = tl.channel('curveU', 0);
  const hopU = tl.channel('hopU', 0);
  const pU = tl.channel('pU', 0);
  const oneWayU = tl.channel('oneWayU', 0);
  const msgU = tl.channel('msgU', 0);
  const settleU = tl.channel('settleU', 0);
  const sigU = tl.channel('sigU', 0);
  const verifyU = tl.channel('verifyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — identity is a number.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A nostr identity is not an account. It is one enormous secret number, picked at random — your nsec. Everything else is derived from it.',
  });
  tl.tween(dU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — the curve.
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'To get a public key, the secret walks on a curve — secp256k1, y squared equals x cubed plus seven. We draw it over the reals to see the geometry; the real thing lives over a huge prime field.',
  });
  tl.tween(curveU, 1, { at: 7.2, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_CURVE, { at: 7.4, dur: 1.4, ease: ease.move });
  // the nsec block leaves the frame while the camera lives on the curve —
  // drop it to a whisper so nothing focal is ever edge-clipped
  tl.tween(dU, 0.15, { at: 7.4, dur: 1.0, ease: ease.move });
  tl.hold(12.8, 0.7);

  // Beat 3 — d hops to P.
  tl.caption({
    at: 13.5,
    dur: 6.4,
    text: 'Start at a fixed point G that everyone agrees on, and add it to itself d times. Each hop is easy. After the last hop you are standing at your public key: P equals d times G.',
  });
  tl.tween(hopU, 1, { at: 14.4, dur: 3.4, ease: ease.linear });
  tl.tween(pU, 1, { at: 18.0, dur: 0.7, ease: ease.pop });
  tl.hold(19.9, 0.7);

  // Beat 4 — one-way street.
  tl.caption({
    at: 20.6,
    dur: 6.0,
    text: 'Here is the asymmetry the whole protocol leans on: given d, finding P takes microseconds. Given P, finding d means undoing the walk — and nobody on earth knows how to do that efficiently.',
  });
  tl.tween(oneWayU, 1, { at: 21.4, dur: 1.0, ease: ease.enter });
  tl.hold(26.6, 0.7);

  // Beat 5 — the message digest.
  tl.caption({
    at: 27.3,
    dur: 5.8,
    text: 'Now sign something. The note is hashed first — these are the real two hundred fifty six bits of its hash — so the signature covers exactly what was said, at any length.',
  });
  tl.tween(cam, CAM_SIGN, { at: 27.5, dur: 1.4, ease: ease.move });
  tl.tween(dU, 1, { at: 28.9, dur: 0.6, ease: ease.move });
  tl.tween(msgU, 1, { at: 27.9, dur: 1.2, ease: ease.draw });
  tl.tween(settleU, 1, { at: 28.8, dur: 2.4, ease: ease.linear });
  tl.hold(33.1, 0.7);

  // Beat 6 — the Schnorr equation.
  tl.caption({
    at: 33.8,
    dur: 6.2,
    text: 'A Schnorr signature is two numbers, R and s, built from the digest and the secret. The magic is what they satisfy: s times G equals R plus the hash challenge times P.',
  });
  tl.tween(oneWayU, 0, { at: 34.2, dur: 0.8, ease: ease.move });
  tl.tween(sigU, 1, { at: 34.6, dur: 1.2, ease: ease.enter });
  tl.hold(40.0, 0.7);

  // Beat 7 — verification needs no secrets.
  tl.caption({
    at: 40.7,
    dur: 6.0,
    text: 'Check that equation and every quantity in it is public: the signature, the digest, the pubkey. Any relay, any client, anywhere can verify — without asking anyone and without learning d.',
  });
  tl.tween(verifyU, 1, { at: 41.8, dur: 0.8, ease: ease.pop });
  tl.hold(46.7, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 47.4,
    dur: 5.4,
    text: 'That is the entire trust model of nostr: no registration, no recovery desk, no permission. One secret number, one public point, and an equation anyone can check.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 47.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.8, dur: 1.0, ease: ease.enter });
  tl.hold(52.8, 1.2);

  return {
    tl, cam, dU, curveU, hopU, pU, oneWayU,
    msgU, settleU, sigU, verifyU, dimU, closeU,
  };
}
