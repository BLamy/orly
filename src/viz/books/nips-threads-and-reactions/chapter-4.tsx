// Nostr Implementation Possibilities №4 — Threads and Reactions, chapter 4.
// NIP-27 (Text Note References): mentions are nostr: URIs inline in content,
// decoded by readers into names; an optional p tag decides whether the
// mention notifies. NIP-22 (Comments): kind 1111, uppercase A/E/K/P tags
// pin the ROOT scope while lowercase a/e/k/p track the immediate parent —
// and comments MUST NOT be used on kind-1 notes (NIP-10 owns those threads).
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { TokenFlight, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const DEREK_PK = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const NPROFILE = 'nostr:nprofile1qqsw3dy8cp…';
const POST_PK = '8b4d0f6a2c8e4b0d6f2a8c4e0b6d2f8a4c0e6b2d8f4a0c6e2b8d4f0a6c2e8b4d';

// the note whose content carries a mention
const CONTENT_LINES = [
  { text: 'huge thanks to ', mention: false },
  { text: NPROFILE, mention: true },
  { text: ' for the relay tips', mention: false },
];
const NOTE_BOX = { x: 90, y: 150, w: 470, h: 150 };
const MENTION_POS = { x: NOTE_BOX.x + 40, y: NOTE_BOX.y + 76 }; // where the URI sits
const CHIP_POS = { x: 330, y: 388 };

// right field: the blog post + comments
const POST = { x: 900, y: 150 };
const C1 = { x: 900, y: 330 };
const C2 = { x: 900, y: 500 };

const CAM_NOTE: CameraState = { x: 380, y: 300, k: 1.25 };
const CAM_POST: CameraState = { x: 880, y: 330, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  noteU: ChannelRef<number>;
  decodeU: ChannelRef<number>;
  pFlyU: ChannelRef<number>;
  whisperU: ChannelRef<number>;
  postU: ChannelRef<number>;
  c1U: ChannelRef<number>;
  c1TagU: ChannelRef<number>;
  c2U: ChannelRef<number>;
  guardU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const noteU = tl.channel('noteU', 0);
  const decodeU = tl.channel('decodeU', 0);
  const pFlyU = tl.channel('pFlyU', 0);
  const whisperU = tl.channel('whisperU', 0);
  const postU = tl.channel('postU', 0);
  const c1U = tl.channel('c1U', 0);
  const c1TagU = tl.channel('c1TagU', 0);
  const c2U = tl.channel('c2U', 0);
  const guardU = tl.channel('guardU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — names live inside the words.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'How do you mention someone in a note? Not with a tag alone — the name lives inside the words themselves, as an address that starts with nostr colon, pasted right into the sentence.',
  });
  tl.tween(noteU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_NOTE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — decoding.
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Publishers write the encoded profile address into the content. Reader clients spot it, decode the public key inside, fetch the profile, and swap the gibberish for a name you can click. Same bytes, two renderings.',
  });
  tl.tween(decodeU, 1, { at: 8.0, dur: 1.8, ease: ease.move });
  tl.hold(12.8, 0.7);

  // Beat 3 — the optional p tag.
  tl.caption({
    at: 13.5,
    dur: 6.2,
    text: 'Whether Derek finds out is a separate choice. Add a p tag with his key, and relays that watch for him light up his notifications. Leave the tag off, and the mention is a whisper — visible to readers, silent to him.',
  });
  tl.tween(pFlyU, 1, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.tween(whisperU, 1, { at: 17.4, dur: 0.9, ease: ease.enter });
  tl.hold(19.9, 0.7);

  // Beat 4 — the comment problem.
  tl.caption({
    at: 20.6,
    dur: 5.6,
    text: 'Now for replying to things that are not notes — a long-form article, a file, even a website. Those conversations get their own event: kind eleven eleven, the comment.',
  });
  tl.tween(cam, CAM_POST, { at: 20.8, dur: 1.5, ease: ease.move });
  tl.tween(postU, 1, { at: 21.6, dur: 0.9, ease: ease.enter });
  tl.tween(c1U, 1, { at: 24.0, dur: 0.8, ease: ease.enter });
  tl.hold(26.4, 0.7);

  // Beat 5 — uppercase and lowercase.
  tl.caption({
    at: 27.1,
    dur: 6.6,
    text: 'A comment carries two complete pointers. Capital letters — capital A, capital K, capital P — pin the root: which article, what kind, whose. Lowercase letters point at the immediate parent. On a first comment, both point at the article.',
  });
  tl.tween(c1TagU, 1, { at: 28.2, dur: 2.4, ease: ease.linear });
  tl.hold(33.9, 0.7);

  // Beat 6 — nesting.
  tl.caption({
    at: 34.6,
    dur: 6.0,
    text: 'Nest a reply under that comment and watch which half moves. The capitals do not budge — still the article. The lowercase pointers swing to the parent comment. Capitals remember the room; lowercase remembers the chair.',
  });
  tl.tween(c2U, 1, { at: 35.6, dur: 1.2, ease: ease.enter });
  tl.hold(40.8, 0.7);

  // Beat 7 — the guard.
  tl.caption({
    at: 41.5,
    dur: 5.8,
    text: 'One hard rule guards the boundary: comments must never be used to reply to a plain note. Notes thread with marked e tags, the way chapter one built them. Two systems, one clean fence between them.',
  });
  tl.tween(guardU, 1, { at: 42.6, dur: 1.2, ease: ease.move });
  tl.hold(47.5, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 48.2,
    dur: 5.2,
    text: 'So mentions ride inside the words, and comments carry their whole ancestry in two letter cases. Everything a client needs to draw the conversation is in the event it just received.',
  });
  tl.tween(dimU, 1, { at: 48.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 49.6, dur: 1.0, ease: ease.enter });
  tl.hold(53.6, 1.2);

  return {
    tl, cam, noteU, decodeU, pFlyU, whisperU, postU,
    c1U, c1TagU, c2U, guardU, dimU, closeU,
  };
}

const scene = buildScene();

function TagChip({ x, y, label, color, u }: { x: number; y: number; label: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={128} height={24} rx={5} fill={colors.PANEL} stroke={color} />
      <text x={x + 8} y={y + 16} fill={color} fontSize={10} fontFamily="monospace">{label}</text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const noteU = s.get(scene.noteU);
  const decodeU = s.get(scene.decodeU);
  const pFlyU = s.get(scene.pFlyU);
  const whisperU = s.get(scene.whisperU);
  const postU = s.get(scene.postU);
  const c1U = s.get(scene.c1U);
  const c1TagU = s.get(scene.c1TagU);
  const c2U = s.get(scene.c2U);
  const guardU = s.get(scene.guardU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const decoded = decodeU >= 1;
  // the mention story yields the stage when the camera parks on the article —
  // otherwise its left-edge labels sit half-clipped in the post framing
  const leftFade = 1 - clamp01(postU * 1.5);
  const leftGone = leftFade <= 0.05;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the note with an inline mention */}
          {noteU > 0 && !leftGone && (
            <g opacity={noteU * leftFade}>
              <rect x={NOTE_BOX.x} y={NOTE_BOX.y} width={NOTE_BOX.w} height={NOTE_BOX.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
              <text x={NOTE_BOX.x + 20} y={NOTE_BOX.y + 30} fill={colors.ACCENT} fontSize={13} fontWeight={600}>
                alice · kind 1
              </text>
              <text x={NOTE_BOX.x + 20} y={NOTE_BOX.y + 60} fill={colors.TEXT} fontSize={13.5}>
                huge thanks to
              </text>
              {/* the mention token: raw URI crossfades into a name chip in place */}
              <g>
                <text x={MENTION_POS.x - 20} y={MENTION_POS.y + 8} fill={colors.SECONDARY} fontSize={12.5} fontFamily="monospace" opacity={1 - decodeU}>
                  {NPROFILE}
                </text>
                {decodeU > 0 && (
                  <g opacity={decodeU}>
                    <rect x={MENTION_POS.x - 22} y={MENTION_POS.y - 9} width={92} height={26} rx={13} fill={colors.SECONDARY} opacity={0.18} />
                    <text x={MENTION_POS.x + 24} y={MENTION_POS.y + 9} textAnchor="middle" fill={colors.SECONDARY} fontSize={13.5} fontWeight={600}>
                      @derek
                    </text>
                  </g>
                )}
              </g>
              <text x={NOTE_BOX.x + 20} y={MENTION_POS.y + 38} fill={colors.TEXT} fontSize={13.5}>
                for the relay tips
              </text>
              {decoded && (
                <text x={NOTE_BOX.x + 20} y={NOTE_BOX.y + NOTE_BOX.h - 12} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={decodeU}>
                  decoded → pubkey {shortHex(DEREK_PK, 8, 4)}
                </text>
              )}
            </g>
          )}

          {/* optional p tag */}
          {!leftGone && (
          <g opacity={leftFade}>
          <TokenFlight
            from={{ x: MENTION_POS.x + 24, y: MENTION_POS.y }}
            to={{ x: CHIP_POS.x, y: CHIP_POS.y }}
            u={pFlyU}
            text={`p ${shortHex(DEREK_PK, 8, 4)}`}
            fill={colors.POSITIVE}
            fontSize={12}
            lift={60}
          />
          {pFlyU >= 1 && (
            <g>
              <rect x={CHIP_POS.x - 92} y={CHIP_POS.y - 18} width={184} height={30} rx={7} fill="none" stroke={colors.POSITIVE} opacity={0.7} />
              <text x={CHIP_POS.x} y={CHIP_POS.y + 32} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                tagged → he gets notified
              </text>
            </g>
          )}
          {whisperU > 0 && (
            <text x={CHIP_POS.x} y={CHIP_POS.y + 56} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={whisperU}>
              omit the tag → a silent mention
            </text>
          )}
          </g>
          )}

          {/* the article + comments */}
          {postU > 0 && (
            <g opacity={postU}>
              <rect x={POST.x - 130} y={POST.y - 46} width={260} height={92} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
              <text x={POST.x - 112} y={POST.y - 20} fill={colors.WARM} fontSize={13} fontWeight={600}>
                article · kind 30023
              </text>
              <text x={POST.x - 112} y={POST.y + 2} fill={colors.TEXT} fontSize={12.5}>
                “running your own relay”
              </text>
              <text x={POST.x - 112} y={POST.y + 26} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                addr 30023:{shortHex(POST_PK, 4, 2)}:relay-guide
              </text>
            </g>
          )}
          {c1U > 0 && (
            <g opacity={c1U}>
              <line x1={POST.x} y1={POST.y + 46} x2={C1.x} y2={C1.y - 40} stroke={colors.GRID} strokeWidth={1.5} />
              <rect x={C1.x - 130} y={C1.y - 40} width={260} height={80} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={C1.x - 112} y={C1.y - 16} fill={colors.POSITIVE} fontSize={12.5} fontWeight={600}>
                comment · kind 1111
              </text>
              <text x={C1.x - 112} y={C1.y + 6} fill={colors.TEXT} fontSize={12}>
                “what about spam filtering?”
              </text>
              <TagChip x={C1.x - 112} y={C1.y + 14} label={'A 30023:…:relay-guide'} color={colors.WARM} u={clamp01(c1TagU * 3)} />
            </g>
          )}
          {c1TagU > 0 && (
            <g>
              <TagChip x={C1.x + 150} y={C1.y - 44} label={'A root · K "30023"'} color={colors.WARM} u={clamp01(c1TagU * 3 - 1)} />
              <TagChip x={C1.x + 150} y={C1.y - 14} label={'P ' + shortHex(POST_PK, 4, 2)} color={colors.WARM} u={clamp01(c1TagU * 3 - 1.5)} />
              <TagChip x={C1.x + 150} y={C1.y + 16} label={'a/k/p → the article'} color={colors.POSITIVE} u={clamp01(c1TagU * 3 - 2)} />
              {clamp01(c1TagU * 3 - 1) > 0 && (
                <text x={C1.x + 150} y={C1.y - 54} fill={colors.MUTED} fontSize={10.5} opacity={clamp01(c1TagU * 3 - 1)}>
                  root scope (capitals)
                </text>
              )}
            </g>
          )}
          {c2U > 0 && (
            <g opacity={c2U}>
              <line x1={C1.x} y1={C1.y + 40} x2={C2.x} y2={C2.y - 40} stroke={colors.GRID} strokeWidth={1.5} />
              <rect x={C2.x - 130} y={C2.y - 40} width={260} height={80} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
              <text x={C2.x - 112} y={C2.y - 16} fill={colors.SECONDARY} fontSize={12.5} fontWeight={600}>
                nested comment · kind 1111
              </text>
              <TagChip x={C2.x + 150} y={C2.y - 34} label={'A 30023:… (unchanged)'} color={colors.WARM} u={c2U} />
              <TagChip x={C2.x + 150} y={C2.y - 4} label={'e/k/p → the comment'} color={colors.SECONDARY} u={clamp01(c2U * 2 - 0.5)} />
            </g>
          )}

          {/* the kind-1 guard */}
          {guardU > 0 && (
            <g opacity={guardU}>
              <rect x={600} y={560} width={330} height={54} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} />
              <line x1={614} y1={574} x2={638} y2={598} stroke={colors.NEGATIVE} strokeWidth={2.6} />
              <line x1={638} y1={574} x2={614} y2={598} stroke={colors.NEGATIVE} strokeWidth={2.6} />
              <text x={652} y={582} fill={colors.TEXT} fontSize={12.5}>
                kind 1111 on a kind-1 note: forbidden
              </text>
              <text x={652} y={600} fill={colors.MUTED} fontSize={11}>
                plain notes thread with marked e tags
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The event carries its whole ancestry
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            mentions ride inside the words · capitals pin the room, lowercase the chair
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-27 nostr: URIs · NIP-22 kind 1111 A/K/P vs a/k/p
          </text>
        </g>
      )}
    </>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
