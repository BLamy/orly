// Nostr Implementation Possibilities №4 — Threads and Reactions, chapter 5.
// NIP-51 (Lists): one replaceable list per standard kind (3 follows, 10000
// mute, 10001 pins, 10002 relays, 10003 bookmarks), public items as tags,
// private items JSON-encoded and NIP-44-encrypted to yourself in content,
// whole-list replacement semantics, and 30000-range SETS with d identifiers
// (many per user). Closes with the book's recap beat.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The shelf of standard lists (NIP-51's replaceable kinds).
// ---------------------------------------------------------------------------
export const SHELF = [
  { kind: 3, label: 'follows' },
  { kind: 10000, label: 'mute' },
  { kind: 10001, label: 'pins' },
  { kind: 10002, label: 'relays' },
  { kind: 10003, label: 'bookmarks' },
];
const SHELF_Y = 140;
const shelfX = (i: number) => 250 + i * 200;

// the mute list we open up
const MUTED_PK = '966698ab2c4f8e0d6a2b8c4e0f6a2d8b4c0e6f2a8d4b0c6e2f8a4d0b6c2e8f4a';
export const MUTE_LIST = {
  kind: 10000,
  tags: [
    ['p', MUTED_PK],
    ['t', 'engagementbait'],
    ['word', 'airdrop'],
  ],
  content: '',
};
const LIST_LAYOUT = layoutJson(MUTE_LIST, {
  x: 96,
  y: 268,
  fontSize: 14.5,
  inlineArrayMax: 44,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw, 8, 4) : raw),
});

// private items that zip into the content blob
const PRIVATE_ITEMS = [
  `p ${shortHex('4c8a2e6f0b3d7a1c5e9f2b6d0a4c8e2f6b0d4a8c2e6f0a4b8d2c6e0f4a8b2d6e', 8, 4)}`,
  `e ${shortHex('b31c5a2f9e4d7c8a1f0b3d5e7a9c2e4f6a8b0d1c3e5f7a9b1d3f5a7c9e1b3d5f', 8, 4)}`,
  'word …',
];
// deterministic fake base64 for the sealed blob (illustrative — labeled so)
const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const rand = mulberry32(51);
const BLOB = Array.from({ length: 44 }, () => b64chars[Math.floor(rand() * 64)]).join('');

const CONTENT_ANCHOR = LIST_LAYOUT.anchor('content');
const PRIV_X = 620;
const PRIV_Y = 300;

// sets (right field, appears late)
const SETS = [
  { d: 'research', n: 41 },
  { d: 'memes', n: 128 },
  { d: 'to-read', n: 9 },
];

const CAM_SHELF: CameraState = { x: 640, y: 240, k: 1.18 };
const CAM_LIST: CameraState = { x: 480, y: 360, k: 1.22 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  shelfU: ChannelRef<number>;
  listU: ChannelRef<number>;
  privU: ChannelRef<number>;
  sealU: ChannelRef<number>;
  eyeU: ChannelRef<number>;
  replaceU: ChannelRef<number>;
  setsU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const shelfU = tl.channel('shelfU', 0);
  const listU = tl.channel('listU', 0);
  const privU = tl.channel('privU', 0);
  const sealU = tl.channel('sealU', 0);
  const eyeU = tl.channel('eyeU', 0);
  const replaceU = tl.channel('replaceU', 0);
  const setsU = tl.channel('setsU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — curation is the other half.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The other half of a social life is curation: who you follow, what you pin, what you refuse to see. Each of those is a list — and every list is, of course, just another event.',
  });
  tl.tween(cam, CAM_SHELF, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(shelfU, 1, { at: 1.0, dur: 2.6, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — one per kind.
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: 'The standard lists each get a reserved kind number: follows, mute, pins, relays, bookmarks. They are replaceable — a relay keeps exactly one per kind per person, and the newest one wins.',
  });
  tl.hold(12.8, 0.7);

  // Beat 3 — open the mute list.
  tl.caption({
    at: 13.5,
    dur: 5.8,
    text: 'Open the mute list. The public entries sit in the tags, plain as day: a key you have silenced, a hashtag you are done with, a word you never want to read again.',
  });
  tl.tween(cam, CAM_LIST, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.tween(listU, 1, { at: 14.4, dur: 1.8, ease: ease.draw });
  tl.hold(19.5, 0.7);

  // Beat 4 — private items seal.
  tl.caption({
    at: 20.2,
    dur: 6.6,
    text: 'But some mutes are nobody’s business. Private entries are gathered into their own little array, encrypted to yourself — your key on both sides of the handshake — and the ciphertext settles into the content field.',
  });
  tl.tween(privU, 1, { at: 21.0, dur: 1.6, ease: ease.enter });
  tl.tween(sealU, 1, { at: 23.2, dur: 2.2, ease: ease.move });
  tl.hold(27.0, 0.7);

  // Beat 5 — the relay's view.
  tl.caption({
    at: 27.7,
    dur: 5.6,
    text: 'Look at what the relay now holds: tags it can index and serve, and a blob it cannot read. It stores half of your mute list without ever learning what the other half says.',
  });
  tl.tween(eyeU, 1, { at: 28.8, dur: 1.0, ease: ease.enter });
  tl.hold(33.5, 0.7);

  // Beat 6 — whole-list replacement.
  tl.caption({
    at: 34.2,
    dur: 6.0,
    text: 'One sharp edge: there is no append. You always publish the entire list again, and the new version replaces the old one wholesale. A client that uploads a stale copy erases everything added since it last synced.',
  });
  tl.tween(replaceU, 1, { at: 35.4, dur: 2.0, ease: ease.move });
  tl.hold(40.4, 0.7);

  // Beat 7 — sets.
  tl.caption({
    at: 41.1,
    dur: 5.8,
    text: 'And when one of something is not enough, the thirty-thousand range holds sets: bookmark folders, follow packs, each with a little d identifier for its name — as many per person as you like.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.3, dur: 1.4, ease: ease.move });
  tl.tween(setsU, 1, { at: 42.2, dur: 2.2, ease: ease.enter });
  tl.hold(47.1, 0.7);

  // Beat 8 — the book's recap.
  tl.caption({
    at: 47.8,
    dur: 6.4,
    text: 'Step back across the whole book: marked tags built the threads, tiny events carried the likes and boosts, addresses in the words carried the mentions, and lists carried your judgment. One tag vocabulary — an entire social network.',
  });
  tl.tween(dimU, 1, { at: 48.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 49.4, dur: 1.0, ease: ease.enter });
  tl.hold(54.4, 1.4);

  return { tl, cam, shelfU, listU, privU, sealU, eyeU, replaceU, setsU, dimU, closeU };
}

const scene = buildScene();

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const shelfU = s.get(scene.shelfU);
  const listU = s.get(scene.listU);
  const privU = s.get(scene.privU);
  const sealU = s.get(scene.sealU);
  const eyeU = s.get(scene.eyeU);
  const replaceU = s.get(scene.replaceU);
  const setsU = s.get(scene.setsU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const sealed = sealU >= 1;
  const oldOp = 1 - 0.85 * clamp01(replaceU * 1.4); // the old list fades wholesale

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the shelf */}
          {SHELF.map((b, i) => {
            const u = clamp01(shelfU * SHELF.length - i);
            if (u <= 0) return null;
            const hot = b.kind === 10000 && listU > 0;
            return (
              <g key={b.kind} opacity={u * (listU > 0 && !hot ? 0.35 : 1)}>
                <rect x={shelfX(i) - 80} y={SHELF_Y - 34} width={160} height={68} rx={10} fill={colors.PANEL} stroke={hot ? colors.WARM : colors.GRID} strokeWidth={hot ? 2 : 1.2} />
                <text x={shelfX(i)} y={SHELF_Y - 8} textAnchor="middle" fill={hot ? colors.WARM : colors.TEXT} fontSize={14} fontWeight={600}>
                  {b.label}
                </text>
                <text x={shelfX(i)} y={SHELF_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  kind {b.kind}
                </text>
              </g>
            );
          })}
          {shelfU >= 1 && listU <= 0 && (
            <text x={640} y={SHELF_Y + 64} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
              replaceable — one per kind, newest wins
            </text>
          )}

          {/* the mute list document */}
          <g opacity={oldOp}>
            <JsonDoc
              layout={LIST_LAYOUT}
              reveal={listU}
              opacity={listU}
              hidden={sealed ? undefined : ['content']}
            />
            {sealed && (
              <text x={CONTENT_ANCHOR.x} y={CONTENT_ANCHOR.cy + 5} fill={colors.SECONDARY} fontSize={11} fontFamily="monospace" opacity={sealU * oldOp}>
                "{BLOB.slice(0, 34)}…"
              </text>
            )}

            {/* private items → sealed blob */}
            {privU > 0 && (
              <g>
                <text x={PRIV_X} y={PRIV_Y - 46} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={privU * (1 - sealU)}>
                  private items — encrypted to yourself
                </text>
                {PRIVATE_ITEMS.map((it, i) => {
                  const u = clamp01(privU * PRIVATE_ITEMS.length - i);
                  if (u <= 0) return null;
                  // each item collapses toward the content anchor as sealU rises
                  const x0 = PRIV_X;
                  const y0 = PRIV_Y + i * 34;
                  const x = x0 + (CONTENT_ANCHOR.cx - x0) * sealU;
                  const y = y0 + (CONTENT_ANCHOR.cy - y0) * sealU;
                  return (
                    <g key={i} opacity={u * (1 - 0.9 * sealU)}>
                      <rect x={x - 4} y={y - 16} width={190 * (1 - 0.5 * sealU)} height={26} rx={6} fill={colors.PANEL} stroke={colors.SECONDARY} />
                      <text x={x + 6} y={y + 1} fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">
                        {it}
                      </text>
                    </g>
                  );
                })}
                {sealU > 0 && sealU < 1 && (
                  <circle cx={CONTENT_ANCHOR.cx} cy={CONTENT_ANCHOR.cy} r={10 + 26 * (1 - sealU)} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} opacity={sealU} />
                )}
                {sealed && (
                  <text x={PRIV_X} y={PRIV_Y - 46} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={0.8}>
                    ciphertext illustrative — scheme is the encryption spec, key = your own
                  </text>
                )}
              </g>
            )}

            {/* the relay's eye */}
            {eyeU > 0 && (
              <g opacity={eyeU}>
                <text x={96} y={520} fill={colors.MUTED} fontSize={12} fontFamily="monospace">the relay sees:</text>
                <text x={230} y={520} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">tags — indexable</text>
                <text x={420} y={520} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">content — opaque</text>
              </g>
            )}
          </g>

          {/* replacement */}
          {replaceU > 0 && (
            <g opacity={clamp01(replaceU * 1.6)}>
              <rect x={96} y={556} width={430} height={52} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
              <text x={112} y={578} fill={colors.WARM} fontSize={12.5} fontWeight={600}>
                new kind-10000 arrives → old version gone, wholesale
              </text>
              <text x={112} y={597} fill={colors.MUTED} fontSize={11}>
                no append: always publish the whole list
              </text>
            </g>
          )}

          {/* sets */}
          {setsU > 0 && (
            <g opacity={setsU}>
              <text x={1000} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                kind 30003 bookmark sets — many per person
              </text>
              {SETS.map((st, i) => {
                const u = clamp01(setsU * SETS.length - i);
                if (u <= 0) return null;
                const y = 360 + i * 62;
                return (
                  <g key={st.d} opacity={u}>
                    <rect x={880} y={y - 22} width={240} height={48} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
                    <text x={898} y={y} fill={colors.ACCENT} fontSize={12.5} fontFamily="monospace">d "{st.d}"</text>
                    <text x={898} y={y + 18} fill={colors.MUTED} fontSize={10.5}>{st.n} items</text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={220} width={880} height={210} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One tag vocabulary — a whole social network
          </text>
          <text x={640} y={332} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            threads · reactions · reposts · mentions · comments · lists
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            all of it events pointing at events — no platform required
          </text>
          <text x={640} y={406} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-10 · NIP-25 · NIP-18 · NIP-27 · NIP-22 · NIP-51
          </text>
        </g>
      )}
    </>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
