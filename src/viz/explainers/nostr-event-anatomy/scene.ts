// Nostr NIP-01 — anatomy of an event. The centerpiece morph chain:
// JSON document → six values fly into the serialization array
// [0, pubkey, created_at, kind, tags, content] → REAL SHA-256 settles in a
// BitField → the digest flies back up into the event's empty "id" slot.
// The id shown is genuinely computed from the serialization per NIP-01;
// pubkey/tag hex and sig are illustrative placeholders (a real sig would
// need a secret key — the structure is what's real here).
import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';
import { hexToBits, layoutJson, sha256Hex, shortHex } from '../../primitives';
import type { JsonLayout } from '../../primitives';

// ---------------------------------------------------------------------------
// The event (module scope, precomputed)
// ---------------------------------------------------------------------------
const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const E_TAG = 'b31c5a2f9e4d7c8a1f0b3d5e7a9c2e4f6a8b0d1c3e5f7a9b1d3f5a7c9e1b3d5f';
const P_TAG = '4c8a2e6f0b3d7a1c5e9f2b6d0a4c8e2f6b0d4a8c2e6f0a4b8d2c6e0f4a8b2d6e';
const CREATED_AT = 1700000000;
const KIND = 1;
const TAGS = [
  ['e', E_TAG],
  ['p', P_TAG],
];
const CONTENT = 'GM nostr';

// NIP-01 serialization + the REAL id.
export const SERIAL = JSON.stringify([0, PUBKEY, CREATED_AT, KIND, TAGS, CONTENT]);
export const ID = sha256Hex(SERIAL);
export const ID_BITS = hexToBits(ID);

export const EVENT = {
  id: ID,
  pubkey: PUBKEY,
  created_at: CREATED_AT,
  kind: KIND,
  tags: TAGS,
  content: CONTENT,
  sig: 'c1d7…(64 bytes of schnorr)',
};

export const LAYOUT: JsonLayout = layoutJson(EVENT, {
  x: 90,
  y: 120,
  fontSize: 15,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});

export const FIELDS = ['id', 'pubkey', 'created_at', 'kind', 'tags', 'content', 'sig'];

// serialization strip cells: [0, pubkey, created_at, kind, tags, content]
export const STRIP_Y = 470;
export const STRIP_CELLS = [
  { label: '0', path: 'kindByte', w: 34 },
  { label: shortHex(PUBKEY, 6, 2), path: 'pubkey', w: 118 },
  { label: String(CREATED_AT), w: 116, path: 'created_at' },
  { label: '1', path: 'kind', w: 34 },
  { label: 'tags', path: 'tags', w: 70 },
  { label: `"${CONTENT}"`, path: 'content', w: 116 },
];
export const STRIP_X = 96;

export const GRID = { x: 856, y: 158, cell: 15, gap: 3 };
export const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

export const TAG_CHIPS = [
  { path: 'tags[0][1]', label: shortHex(E_TAG, 6, 2), kindLabel: 'e — replies to an event', x: 560, y: 285 },
  { path: 'tags[1][1]', label: shortHex(P_TAG, 6, 2), kindLabel: 'p — mentions a person', x: 560, y: 350 },
];

const CAM_JSON: CameraState = { x: 320, y: 300, k: 1.25 };
const CAM_GRID: CameraState = { x: 830, y: 340, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  sweepF: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  tagU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  serU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  settleU: ChannelRef<number>;
  idFlyU: ChannelRef<number>;
  sigU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const sweepF = tl.channel('sweepF', -1);
  const sweepU = tl.channel('sweepU', 0);
  const tagU = tl.channel('tagU', 0);
  const stripU = tl.channel('stripU', 0);
  const serU = tl.channel('serU', 0);
  const gridU = tl.channel('gridU', 0);
  const settleU = tl.channel('settleU', 0);
  const idFlyU = tl.channel('idFlyU', 0);
  const sigU = tl.channel('sigU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the whole protocol is one JSON object.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Everything on nostr — every note, profile, and reaction — is a single small object called an event. Seven fields of plain text. This is the entire data model, so it is worth reading slowly.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.4, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — sweep the fields.
  tl.caption({
    at: 7.0,
    dur: 6.4,
    text: 'An identifier, an author, a timestamp, a kind number saying what sort of thing this is, some tags, the content itself — and a signature. Notice the id slot is still empty.',
  });
  tl.tween(sweepU, 1, { at: 7.2, dur: 0.5, ease: ease.enter });
  tl.set(sweepF, 0, 7.4);
  tl.tween(sweepF, FIELDS.length - 1, { at: 7.6, dur: 4.6, ease: ease.linear });
  tl.tween(sweepU, 0, { at: 12.6, dur: 0.6, ease: ease.move });
  tl.hold(13.4, 0.7);

  // Beat 3 — tags fly out into meaning.
  tl.caption({
    at: 14.1,
    dur: 6.2,
    text: 'Tags are how events point at each other. An e tag references another event — a reply thread. A p tag references a person. Watch the values leave the document and become what they mean.',
  });
  tl.tween(tagU, 1, { at: 15.2, dur: 2.2, ease: ease.move });
  tl.hold(20.3, 0.7);

  // Beat 4 — the serialization array assembles.
  tl.caption({
    at: 21.0,
    dur: 6.6,
    text: 'So where does the id come from? The spec lines six things up in a strict order: a literal zero, then pubkey, timestamp, kind, tags, and content — serialized with no whitespace at all.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 21.2, dur: 1.4, ease: ease.move });
  tl.tween(tagU, 0, { at: 21.2, dur: 0.9, ease: ease.move });
  tl.tween(stripU, 1, { at: 22.2, dur: 0.8, ease: ease.enter });
  tl.tween(serU, 1, { at: 23.0, dur: 3.4, ease: ease.linear });
  tl.hold(27.6, 0.7);

  // Beat 5 — SHA-256 settles.
  tl.caption({
    at: 28.3,
    dur: 6.4,
    text: 'That byte string goes through the S H A two fifty six hash. Sixty four rounds of mixing, and two hundred fifty-six bits settle into place. These are the actual bits of this event’s hash — computed, not decorated.',
  });
  tl.tween(cam, CAM_GRID, { at: 28.5, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 28.9, dur: 1.4, ease: ease.draw });
  tl.tween(settleU, 1, { at: 30.0, dur: 3.2, ease: ease.linear });
  tl.hold(34.7, 0.7);

  // Beat 6 — the digest becomes the id.
  tl.caption({
    at: 35.4,
    dur: 6.0,
    text: 'And that digest is exactly the id. It flies home into the empty slot. Change one character of the content and every one of those bits reshuffles — the id is a fingerprint of exactly what was said.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 35.6, dur: 1.4, ease: ease.move });
  tl.tween(idFlyU, 1, { at: 36.6, dur: 1.5, ease: ease.move });
  tl.hold(41.4, 0.7);

  // Beat 7 — the signature seals it.
  tl.caption({
    at: 42.1,
    dur: 6.2,
    text: 'Finally the author signs that id with their secret key — a Schnorr signature over secp256k1. Anyone holding the pubkey can check it. No account, no server, no password: the keypair is the identity.',
  });
  tl.tween(sigU, 1, { at: 43.2, dur: 1.0, ease: ease.enter });
  tl.hold(48.3, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 49.0,
    dur: 5.6,
    text: 'One object, self-contained: the id proves what was said, the signature proves who said it. Every other proposal in the protocol is built on top of this little machine.',
  });
  tl.tween(dimU, 1, { at: 49.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.4, dur: 1.0, ease: ease.enter });
  tl.hold(54.6, 1.2);

  return {
    tl, cam, jsonU, sweepF, sweepU, tagU, stripU, serU,
    gridU, settleU, idFlyU, sigU, dimU, closeU,
  };
}
