// Nostr Implementation Possibilities №4 — Threads and Reactions, chapter 1.
// NIP-10 (Text Notes and Threads): the marked e-tag ["e", <id>, <relay>,
// <marker>, <pubkey>] with "root"/"reply" markers, p-tag propagation (a reply
// carries the original's p tags plus its author), and the deprecated
// positional scheme where order guessed meaning. Everything shown is the
// spec's own tag shapes; ids are illustrative hex.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The cast: Alice's root note, Bob's reply (composed live), Carol's reply.
// ---------------------------------------------------------------------------
const ROOT_ID = '91c3a5f2b8d04e6a7c1f9b3d5e8a0c2f4b6d8e0a2c4f6b8d0e2a4c6f8b0d2e4a';
const ALICE_PK = '7f3a9c1e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a';
const BOB_ID = '2e6a0c4f8b2d6e0a4c8f2b6d0e4a8c2f6b0d4e8a2c6f0b4d8e2a6c0f4b8d2e6a';
const BOB_PK = '5d1f7b3e9a5c1d7f3b9e5a1c7d3f9b5e1a7c3d9f5b1e7a3c9d5f1b7e3a9c5d1f';
const CAROL_PK = '8b4d0f6a2c8e4b0d6f2a8c4e0b6d2f8a4c0e6b2d8f4a0c6e2b8d4f0a6c2e8b4d';
const RELAY = 'wss://relay.example';

// Bob's reply as it will finally stand (the JsonDoc we compose into).
export const BOB_REPLY = {
  kind: 1,
  pubkey: BOB_PK,
  content: 'welcome to nostr!',
  tags: [
    ['e', ROOT_ID, RELAY, 'root'],
    ['p', ALICE_PK],
  ],
};

const REPLY_LAYOUT = layoutJson(BOB_REPLY, {
  x: 78,
  y: 168,
  fontSize: 14.5,
  inlineArrayMax: 58,
  abbrev: (_p, raw) => (raw.length > 30 ? shortHex(raw, 8, 4) : raw),
});

// Carol's two marked e-tags, shown as chips (not a second full document).
const CAROL_TAGS = [
  { tag: 'e', val: shortHex(ROOT_ID, 6, 2), marker: 'root' },
  { tag: 'e', val: shortHex(BOB_ID, 6, 2), marker: 'reply' },
  { tag: 'p', val: shortHex(ALICE_PK, 6, 2), marker: '' },
  { tag: 'p', val: shortHex(BOB_PK, 6, 2), marker: '' },
];

// thread tree (right field)
const TREE = {
  root: { x: 950, y: 150 },
  bob: { x: 950, y: 330 },
  carol: { x: 950, y: 500 },
};

const CAM_JSON: CameraState = { x: 400, y: 330, k: 1.22 };
const CAM_TREE: CameraState = { x: 800, y: 330, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rootU: ChannelRef<number>;
  draftU: ChannelRef<number>;
  eFlyU: ChannelRef<number>;
  markU: ChannelRef<number>;
  pFlyU: ChannelRef<number>;
  carolU: ChannelRef<number>;
  carolTagU: ChannelRef<number>;
  ghostU: ChannelRef<number>;
  shuffleU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rootU = tl.channel('rootU', 0);
  const draftU = tl.channel('draftU', 0);
  const eFlyU = tl.channel('eFlyU', 0);
  const markU = tl.channel('markU', 0);
  const pFlyU = tl.channel('pFlyU', 0);
  const carolU = tl.channel('carolU', 0);
  const carolTagU = tl.channel('carolTagU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const shuffleU = tl.channel('shuffleU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — there is no reply button.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Alice posts a note, and it is completely alone. The protocol has no reply button, no thread table, no conversation object. All it has is tags — and that turns out to be enough.',
  });
  tl.tween(rootU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.hold(6.5, 0.7);

  // Beat 2 — Bob starts a reply.
  tl.caption({
    at: 7.2,
    dur: 5.6,
    text: 'Bob wants to answer. His client composes a perfectly ordinary note — same kind, his key, his words. Nothing about it is a reply yet. Watch the tags array: it is still empty.',
  });
  tl.tween(cam, CAM_JSON, { at: 7.4, dur: 1.4, ease: ease.move });
  tl.tween(draftU, 1, { at: 8.0, dur: 2.0, ease: ease.draw });
  tl.hold(12.8, 0.7);

  // Beat 3 — the e tag flies in, marked root.
  tl.caption({
    at: 13.5,
    dur: 6.4,
    text: 'Then one tag does all the work. The id of Alice’s note flies into an e tag, with a relay hint for where to find it — and a fourth entry, the marker, that says exactly what this reference means: root.',
  });
  tl.tween(eFlyU, 1, { at: 14.6, dur: 1.6, ease: ease.move });
  tl.tween(markU, 1, { at: 16.6, dur: 0.6, ease: ease.pop });
  tl.hold(19.9, 0.7);

  // Beat 4 — p propagation.
  tl.caption({
    at: 20.6,
    dur: 5.8,
    text: 'One more courtesy: Alice’s public key lands in a p tag, so relays that watch for her key can wake her client up. The reply notifies the person, and the e tag places the words.',
  });
  tl.tween(pFlyU, 1, { at: 21.6, dur: 1.4, ease: ease.move });
  tl.hold(26.4, 0.7);

  // Beat 5 — Carol replies to Bob: two markers.
  tl.caption({
    at: 27.1,
    dur: 6.6,
    text: 'Now Carol answers Bob, and the pattern deepens. Her note carries two e tags: one marked root, still pointing at Alice’s note, and one marked reply, pointing at Bob’s. Root says which conversation. Reply says which branch.',
  });
  tl.tween(cam, CAM_TREE, { at: 27.3, dur: 1.4, ease: ease.move });
  tl.tween(carolU, 1, { at: 28.2, dur: 0.8, ease: ease.enter });
  tl.tween(carolTagU, 1, { at: 29.0, dur: 2.6, ease: ease.linear });
  tl.hold(33.9, 0.7);

  // Beat 6 — p union.
  tl.caption({
    at: 34.6,
    dur: 5.4,
    text: 'And her p tags are the union: everyone the parent notified, plus the parent’s author. The whole audience of a thread rides along in the tags, hop by hop.',
  });
  tl.hold(40.2, 0.7);

  // Beat 7 — the deprecated positional scheme.
  tl.caption({
    at: 40.9,
    dur: 6.4,
    text: 'It was not always this explicit. The old scheme had no markers — position alone guessed the meaning: first e tag was the root, last was the parent. Shuffle the order and the thread silently rewires. That is why the markers won.',
  });
  tl.tween(ghostU, 1, { at: 41.6, dur: 1.0, ease: ease.enter });
  tl.tween(shuffleU, 1, { at: 44.0, dur: 1.6, ease: ease.move });
  tl.hold(47.5, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 48.2,
    dur: 5.6,
    text: 'So a thread is not a thing anyone stores. It is a claim each note makes about where it belongs — one marked tag for the conversation, one for the branch, and the audience carried along.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 48.4, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 48.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 49.6, dur: 1.0, ease: ease.enter });
  tl.hold(53.8, 1.2);

  return {
    tl, cam, rootU, draftU, eFlyU, markU, pFlyU,
    carolU, carolTagU, ghostU, shuffleU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function NoteCard({ x, y, who, text, id, color, u, glow = 0 }: {
  x: number; y: number; who: string; text: string; id: string; color: string; u: number; glow?: number;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x - 105} y={y - 42} width={210} height={84} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={glow > 0 ? 2.2 : 1.4} />
      <text x={x - 90} y={y - 18} fill={color} fontSize={13} fontWeight={600}>{who}</text>
      <text x={x - 90} y={y + 4} fill={colors.TEXT} fontSize={13}>{text}</text>
      <text x={x - 90} y={y + 26} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">id {id}</text>
    </g>
  );
}

const E_ANCHOR = REPLY_LAYOUT.anchor('tags[0][1]');
const P_ANCHOR = REPLY_LAYOUT.anchor('tags[1][1]');
const MARK_ANCHOR = REPLY_LAYOUT.anchor('tags[0][3]');

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rootU = s.get(scene.rootU);
  const draftU = s.get(scene.draftU);
  const eFlyU = s.get(scene.eFlyU);
  const markU = s.get(scene.markU);
  const pFlyU = s.get(scene.pFlyU);
  const carolU = s.get(scene.carolU);
  const carolTagU = s.get(scene.carolTagU);
  const ghostU = s.get(scene.ghostU);
  const shuffleU = s.get(scene.shuffleU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const bobPlaced = eFlyU >= 1;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* thread tree, right field */}
          <NoteCard x={TREE.root.x} y={TREE.root.y} who="alice" text="just set up my nostr" id={shortHex(ROOT_ID, 8, 4)} color={colors.ACCENT} u={rootU} />
          {bobPlaced && (
            <g>
              <line x1={TREE.root.x} y1={TREE.root.y + 42} x2={TREE.bob.x} y2={TREE.bob.y - 42} stroke={colors.WARM} strokeWidth={1.8} opacity={Math.min(1, eFlyU)} />
              <text x={TREE.root.x + 12} y={(TREE.root.y + TREE.bob.y) / 2 + 4} fill={colors.WARM} fontSize={11} fontFamily="monospace" opacity={markU}>
                root
              </text>
            </g>
          )}
          <NoteCard x={TREE.bob.x} y={TREE.bob.y} who="bob" text="welcome to nostr!" id={shortHex(BOB_ID, 8, 4)} color={colors.POSITIVE} u={bobPlaced ? 1 : 0} />
          {carolU > 0 && (
            <g>
              <line x1={TREE.bob.x} y1={TREE.bob.y + 42} x2={TREE.carol.x} y2={TREE.carol.y - 42} stroke={colors.SECONDARY} strokeWidth={1.8} opacity={clamp01(carolTagU * 2 - 1)} />
              <text x={TREE.bob.x + 12} y={(TREE.bob.y + TREE.carol.y) / 2 + 4} fill={colors.SECONDARY} fontSize={11} fontFamily="monospace" opacity={clamp01(carolTagU * 2 - 1)}>
                reply
              </text>
              {/* carol → root long arc, marked root */}
              <path
                d={`M${TREE.carol.x - 105},${TREE.carol.y} C ${TREE.carol.x - 240},${TREE.carol.y - 60} ${TREE.root.x - 240},${TREE.root.y + 60} ${TREE.root.x - 105},${TREE.root.y}`}
                fill="none" stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="5 5"
                opacity={clamp01(carolTagU * 2) * 0.8}
              />
              <text x={TREE.carol.x - 250} y={(TREE.root.y + TREE.carol.y) / 2 + 4} fill={colors.WARM} fontSize={11} fontFamily="monospace" opacity={clamp01(carolTagU * 2) * 0.9}>
                root
              </text>
            </g>
          )}
          <NoteCard x={TREE.carol.x} y={TREE.carol.y} who="carol" text="thanks bob, helping her out" id={shortHex('a7e3', 4, 0)} color={colors.SECONDARY} u={carolU} />
          {/* carol's tag chips */}
          {carolU > 0 &&
            CAROL_TAGS.map((t, i) => {
              const u = clamp01(carolTagU * CAROL_TAGS.length - i);
              if (u <= 0) return null;
              const y = TREE.carol.y + 62 + 0;
              const x = TREE.carol.x - 180 + i * 96;
              return (
                <g key={i} opacity={u}>
                  <rect x={x - 42} y={y - 14} width={84} height={28} rx={6} fill={colors.PANEL} stroke={t.marker ? (t.marker === 'root' ? colors.WARM : colors.SECONDARY) : colors.GRID} />
                  <text x={x} y={y - 1} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily="monospace">
                    {t.tag} {t.val}
                  </text>
                  {t.marker && (
                    <text x={x} y={y + 11} textAnchor="middle" fill={t.marker === 'root' ? colors.WARM : colors.SECONDARY} fontSize={9.5} fontFamily="monospace">
                      {t.marker}
                    </text>
                  )}
                </g>
              );
            })}

          {/* Bob's reply JSON, composed live */}
          <JsonDoc
            layout={REPLY_LAYOUT}
            reveal={draftU}
            opacity={draftU}
            hidden={[
              ...(eFlyU < 1 ? ['tags[0][1]', 'tags[0][2]'] : []),
              ...(markU < 1 ? ['tags[0][3]'] : []),
              ...(pFlyU < 1 ? ['tags[1][1]'] : []),
            ]}
          />
          {draftU >= 1 && (
            <text x={78} y={146} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={draftU}>
              bob’s reply — composed by his client
            </text>
          )}

          {/* flights: root id → e tag slot; alice pk → p tag slot */}
          <TokenFlight
            from={{ x: TREE.root.x - 90, y: TREE.root.y + 22 }}
            to={{ x: E_ANCHOR.cx, y: E_ANCHOR.cy + 5 }}
            u={eFlyU}
            text={shortHex(ROOT_ID, 8, 4)}
            fill={colors.POSITIVE}
            fontSize={13}
            lift={110}
            holdAtEnd={false}
          />
          <TokenFlight
            from={{ x: TREE.root.x - 90, y: TREE.root.y - 22 }}
            to={{ x: P_ANCHOR.cx, y: P_ANCHOR.cy + 5 }}
            u={pFlyU}
            text={shortHex(ALICE_PK, 8, 4)}
            fill={colors.POSITIVE}
            fontSize={13}
            lift={140}
            holdAtEnd={false}
          />
          {markU > 0 && markU < 1 && (
            <circle cx={MARK_ANCHOR.cx} cy={MARK_ANCHOR.cy} r={18 * (1 - markU) + 4} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={markU} />
          )}

          {/* the deprecated positional ghost */}
          {ghostU > 0 && (
            <g opacity={ghostU * 0.9}>
              <text x={78} y={470} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                the old way — position guessed meaning (deprecated)
              </text>
              {[0, 1].map((i) => {
                // shuffle swaps the two tags' x positions
                const swap = clamp01(shuffleU);
                const base = 78 + i * 210;
                const other = 78 + (1 - i) * 210;
                const x = base + (other - base) * swap;
                const label = i === 0 ? `e ${shortHex(ROOT_ID, 6, 2)}` : `e ${shortHex(BOB_ID, 6, 2)}`;
                const meaning = (i === 0) !== (swap >= 0.5) ? 'read as: root' : 'read as: parent';
                return (
                  <g key={i}>
                    <rect x={x} y={488} width={190} height={30} rx={6} fill={colors.PANEL} stroke={colors.GRID} strokeDasharray="4 4" />
                    <text x={x + 95} y={507} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">{label}</text>
                    <text x={x + 95} y={536} textAnchor="middle" fill={swap >= 0.5 ? colors.NEGATIVE : colors.MUTED} fontSize={10.5}>
                      {meaning}
                    </text>
                  </g>
                );
              })}
              {shuffleU >= 0.5 && (
                <text x={520} y={507} fill={colors.NEGATIVE} fontSize={12} opacity={clamp01((shuffleU - 0.5) * 4)}>
                  order changed → thread rewired
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A thread is a claim, not a table
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            marked e tags place the words · p tags carry the audience
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-10 · ["e", id, relay, "root"|"reply", pubkey]
          </text>
        </g>
      )}
    </>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
