// Nostr NIP-65 — the relay list, and the JSON ↔ picture ROUND TRIP.
// The signature move of the NIPs series: a kind-10002 event's r-tags fly out
// of the document and become a live relay topology (client, servers, read/
// write edges, streaming traffic) — then fold back into the same JSON,
// because on the wire it never stopped being JSON.
// Grounded in NIP-65: ['r', <url>] = read+write, optional 'read'/'write'
// marker restricts the direction.
import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';
import { layoutJson, shortHex } from '../../primitives';
import type { JsonLayout } from '../../primitives';

const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';

export const EVENT = {
  kind: 10002,
  pubkey: PUBKEY,
  created_at: 1700000000,
  tags: [
    ['r', 'wss://relay.damus.io'],
    ['r', 'wss://nos.lol', 'read'],
    ['r', 'wss://relay.snort.social', 'write'],
  ],
  content: '',
};

export const LAYOUT: JsonLayout = layoutJson(EVENT, {
  x: 80,
  y: 150,
  fontSize: 15,
  inlineArrayMax: 52,
  abbrev: (_p, raw) => (raw.length > 30 ? shortHex(raw) : raw),
});

export interface RelaySpec {
  path: string;
  url: string;
  short: string;
  mode: 'read + write' | 'read' | 'write';
  x: number;
  y: number;
}

export const RELAYS: RelaySpec[] = [
  { path: 'tags[0][1]', url: 'wss://relay.damus.io', short: 'relay.damus.io', mode: 'read + write', x: 1010, y: 170 },
  { path: 'tags[1][1]', url: 'wss://nos.lol', short: 'nos.lol', mode: 'read', x: 1010, y: 330 },
  { path: 'tags[2][1]', url: 'wss://relay.snort.social', short: 'relay.snort.social', mode: 'write', x: 1010, y: 490 },
];

export const CLIENT = { x: 640, y: 330 };
export const NODE_HALF_W = 84;

const CAM_JSON: CameraState = { x: 330, y: 300, k: 1.3 };
const CAM_MAP: CameraState = { x: 800, y: 330, k: 1.12 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  kindU: ChannelRef<number>;
  outU: ChannelRef<number>;
  clientU: ChannelRef<number>;
  connU: ChannelRef<number>;
  flowU: ChannelRef<number>;
  backU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const kindU = tl.channel('kindU', 0);
  const outU = tl.channel('outU', 0);
  const clientU = tl.channel('clientU', 0);
  const connU = tl.channel('connU', 0);
  const flowU = tl.channel('flowU', 0);
  const backU = tl.channel('backU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the relay list is itself an event.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Where you can be found on nostr is not stored by a company. It is an event you publish — kind ten thousand and two — whose tags are simply a list of relay URLs.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the kind number is the schema.
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: 'The kind number is the whole schema. Ten thousand and two means: treat my r tags as a relay list, and keep only the latest one — publishing a new list replaces the old.',
  });
  tl.tween(kindU, 1, { at: 7.4, dur: 0.6, ease: ease.enter });
  tl.tween(kindU, 0, { at: 11.6, dur: 0.6, ease: ease.move });
  tl.hold(12.6, 0.7);

  // Beat 3 — the URLs leave the document.
  tl.caption({
    at: 13.3,
    dur: 6.2,
    text: 'Now watch the values stop being strings. Each URL lifts out of the JSON and becomes the thing it names: a relay — a plain websocket server that stores and forwards events.',
  });
  tl.tween(cam, CAM_MAP, { at: 13.6, dur: 1.5, ease: ease.move });
  tl.tween(outU, 1, { at: 14.4, dur: 2.8, ease: ease.linear });
  tl.hold(19.5, 0.7);

  // Beat 4 — read/write directions.
  tl.caption({
    at: 20.2,
    dur: 6.4,
    text: 'The optional third element is a direction. No marker means read and write. A read relay is where you listen for mentions. A write relay is where your own notes land.',
  });
  tl.tween(clientU, 1, { at: 20.6, dur: 0.7, ease: ease.enter });
  tl.tween(connU, 1, { at: 21.4, dur: 2.4, ease: ease.linear });
  tl.hold(26.6, 0.7);

  // Beat 5 — traffic.
  tl.caption({
    at: 27.3,
    dur: 6.0,
    text: 'Followers read your notes from your write relays, and you read theirs from their write relays. The list is the routing table for a network with no center.',
  });
  tl.tween(flowU, 5, { at: 27.5, dur: 5.6, ease: ease.linear });
  tl.hold(33.3, 0.7);

  // Beat 6 — fold it back.
  tl.caption({
    at: 34.0,
    dur: 6.0,
    text: 'And here is the point of the exercise: fold the picture back up. The topology, the directions, the routing — all of it never stopped being three lines of JSON that travel with you.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 34.3, dur: 1.5, ease: ease.move });
  tl.tween(backU, 1, { at: 35.2, dur: 2.6, ease: ease.linear });
  tl.hold(40.0, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.7,
    dur: 5.4,
    text: 'Change relays? Publish a new list. Every client that follows you re-routes automatically. Portability is not a feature bolted on top — it is a consequence of the data model.',
  });
  tl.tween(dimU, 1, { at: 41.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.1, dur: 1.0, ease: ease.enter });
  tl.hold(46.1, 1.2);

  return { tl, cam, jsonU, kindU, outU, clientU, connU, flowU, backU, dimU, closeU };
}
