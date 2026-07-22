// Nostr Implementation Possibilities №4 — Threads and Reactions, chapter 3.
// NIP-25 (Reactions): kind 7, content "+"/"-"/emoji, e/p/k tags, client-side
// tallying; emoji display as reactions, not votes. NIP-18 (Reposts): kind 6
// carries the reposted note's stringified JSON in content with an e tag +
// relay hint; kind 16 generalizes with a k tag; quote reposts use a q tag so
// they never masquerade as thread replies.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { flightPos, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const NOTE_ID = '91c3a5f2b8d04e6a7c1f9b3d5e8a0c2f4b6d8e0a2c4f6b8d0e2a4c6f8b0d2e4a';
const NOTE = { x: 400, y: 300 };

// eleven reactions, precomputed approach arcs. content per NIP-25.
interface Reaction { glyph: string; kind: 'up' | 'down' | 'emoji'; angle: number }
export const REACTIONS: Reaction[] = [
  { glyph: '+', kind: 'up', angle: -160 },
  { glyph: '+', kind: 'up', angle: -130 },
  { glyph: '🔥', kind: 'emoji', angle: -100 },
  { glyph: '+', kind: 'up', angle: -70 },
  { glyph: '+', kind: 'up', angle: -40 },
  { glyph: '🔥', kind: 'emoji', angle: 175 },
  { glyph: '+', kind: 'up', angle: 150 },
  { glyph: '-', kind: 'down', angle: 125 },
  { glyph: '+', kind: 'up', angle: 100 },
  { glyph: '🔥', kind: 'emoji', angle: 75 },
  { glyph: '+', kind: 'up', angle: 50 },
];
const N_UP = REACTIONS.filter((r) => r.kind === 'up').length; // 7
const N_EMOJI = REACTIONS.filter((r) => r.kind === 'emoji').length; // 3
const N_DOWN = REACTIONS.filter((r) => r.kind === 'down').length; // 1

const orbPos = (r: Reaction, u: number) => {
  const a = (r.angle * Math.PI) / 180;
  const from = { x: NOTE.x + Math.cos(a) * 420, y: NOTE.y + Math.sin(a) * 300 };
  const to = { x: NOTE.x + Math.cos(a) * 150, y: NOTE.y + Math.sin(a) * 105 };
  return flightPos(from, to, u, 30);
};

// bob's followers lane (repost destination)
const LANE_X = 1060;
const REPOST_DEST = { x: LANE_X, y: 250 };

const CAM_NOTE: CameraState = { x: 430, y: 310, k: 1.25 };
const CAM_WIDE: CameraState = { x: 660, y: 330, k: 1.05 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  noteU: ChannelRef<number>;
  orbU: ChannelRef<number>;
  tagU: ChannelRef<number>;
  tallyU: ChannelRef<number>;
  repostU: ChannelRef<number>;
  kindsU: ChannelRef<number>;
  quoteU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const noteU = tl.channel('noteU', 0);
  const orbU = tl.channel('orbU', 0);
  const tagU = tl.channel('tagU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const repostU = tl.channel('repostU', 0);
  const kindsU = tl.channel('kindsU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const gateU = tl.channel('gateU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — small events.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Not every response is a reply. Most of what a note attracts is smaller: a like, an emoji, a boost. Each one of those is a complete signed event of its own — tiny, but with the full anatomy.',
  });
  tl.tween(noteU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_NOTE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — reactions arrive.
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Reactions are kind seven. The whole payload is the content string: a plus to like, a minus to dislike, or any emoji. Eleven people react, and eleven little events orbit in.',
  });
  tl.tween(orbU, 1, { at: 7.4, dur: 3.6, ease: ease.linear });
  tl.hold(12.8, 0.7);

  // Beat 3 — the tags on one of them.
  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'Open one up and it knows exactly what it touched: an e tag with the note’s id, a p tag with the author, and a k tag naming the kind it reacted to — so a relay can filter reactions without fetching their targets.',
  });
  tl.tween(tagU, 1, { at: 14.4, dur: 1.4, ease: ease.enter });
  tl.hold(19.5, 0.7);

  // Beat 4 — tallying is client-side.
  tl.caption({
    at: 20.2,
    dur: 5.8,
    text: 'Nobody stores a like counter. Your client counts what it sees: seven plusses, three fires, one minus. The plus and minus read as votes; the emoji just display. Different clients may even count differently.',
  });
  tl.tween(tallyU, 1, { at: 21.0, dur: 1.8, ease: ease.draw });
  tl.hold(26.7, 0.7);

  // Beat 5 — the repost swallows the note.
  tl.caption({
    at: 27.4,
    dur: 6.4,
    text: 'A repost goes further — it carries the note bodily. Kind six wraps the entire original, stringified, inside its own content, adds an e tag with a relay hint, and ships the whole package to your followers.',
  });
  tl.tween(cam, CAM_WIDE, { at: 27.6, dur: 1.4, ease: ease.move });
  tl.tween(repostU, 1, { at: 28.6, dur: 2.2, ease: ease.move });
  tl.hold(33.8, 0.7);

  // Beat 6 — kind 16.
  tl.caption({
    at: 34.5,
    dur: 4.8,
    text: 'Reposting something that is not a plain note? Kind sixteen does the same dance for any event, with a k tag declaring what species it carried.',
  });
  tl.tween(kindsU, 1, { at: 35.4, dur: 0.9, ease: ease.enter });
  tl.hold(39.3, 0.7);

  // Beat 7 — the quote and the q tag.
  tl.caption({
    at: 40.0,
    dur: 6.6,
    text: 'And a quote is a note that embeds another. It cites the target with a q tag — q, not e — and that single letter is the fence: quotes never pile into the target’s thread as replies. Commentary stays commentary.',
  });
  tl.tween(quoteU, 1, { at: 41.0, dur: 1.6, ease: ease.enter });
  tl.tween(gateU, 1, { at: 43.4, dur: 1.4, ease: ease.move });
  tl.hold(46.6, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 47.3,
    dur: 5.4,
    text: 'Likes, boosts, quotes — none of them needed a feature release. They are all just events pointing at events, with one tag choosing the meaning. The social layer is a vocabulary, not a platform.',
  });
  tl.tween(dimU, 1, { at: 47.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.7, dur: 1.0, ease: ease.enter });
  tl.hold(52.7, 1.2);

  return { tl, cam, noteU, orbU, tagU, tallyU, repostU, kindsU, quoteU, gateU, dimU, closeU };
}

const scene = buildScene();

const TALLY = [
  { label: '+', n: N_UP, color: colors.POSITIVE },
  { label: '🔥', n: N_EMOJI, color: colors.WARM },
  { label: '-', n: N_DOWN, color: colors.NEGATIVE },
];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const noteU = s.get(scene.noteU);
  const orbU = s.get(scene.orbU);
  const tagU = s.get(scene.tagU);
  const tallyU = s.get(scene.tallyU);
  const repostU = s.get(scene.repostU);
  const kindsU = s.get(scene.kindsU);
  const quoteU = s.get(scene.quoteU);
  const gateU = s.get(scene.gateU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const orbFade = 1 - 0.6 * clamp01(repostU * 2); // reactions recede for the repost story

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* alice's note */}
          {noteU > 0 && (
            <g opacity={noteU}>
              <rect x={NOTE.x - 110} y={NOTE.y - 44} width={220} height={88} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
              <text x={NOTE.x - 94} y={NOTE.y - 18} fill={colors.ACCENT} fontSize={13} fontWeight={600}>alice · kind 1</text>
              <text x={NOTE.x - 94} y={NOTE.y + 4} fill={colors.TEXT} fontSize={13}>just set up my nostr</text>
              <text x={NOTE.x - 94} y={NOTE.y + 27} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">id {shortHex(NOTE_ID, 8, 4)}</text>
            </g>
          )}

          {/* reactions */}
          <g opacity={orbFade}>
            {REACTIONS.map((r, i) => {
              const u = clamp01(orbU * REACTIONS.length - i);
              if (u <= 0) return null;
              const p = orbPos(r, u);
              const c = r.kind === 'up' ? colors.POSITIVE : r.kind === 'down' ? colors.NEGATIVE : colors.WARM;
              return (
                <g key={i} opacity={Math.min(1, u * 1.5)}>
                  <circle cx={p.x} cy={p.y} r={14} fill={colors.PANEL} stroke={c} strokeWidth={1.6} />
                  <text x={p.x} y={p.y + 5} textAnchor="middle" fill={c} fontSize={12}>{r.glyph}</text>
                </g>
              );
            })}
            {/* one exemplar's tags */}
            {tagU > 0 && (
              <g opacity={tagU * orbFade}>
                {(
                  [
                    ['e', shortHex(NOTE_ID, 6, 2)],
                    ['p', 'alice'],
                    ['k', '"1"'],
                  ] as const
                ).map(([t, v], i) => (
                  <g key={t}>
                    <rect x={92} y={128 + i * 36} width={150} height={28} rx={6} fill={colors.PANEL} stroke={colors.SECONDARY} />
                    <text x={104} y={146 + i * 36} fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">
                      {t} {v}
                    </text>
                  </g>
                ))}
                <text x={92} y={116} fill={colors.MUTED} fontSize={11} fontFamily="monospace">inside one kind-7 event</text>
              </g>
            )}
            {/* tallies */}
            {tallyU > 0 && (
              <g opacity={tallyU}>
                {TALLY.map((t, i) => {
                  const w = 30 * t.n * clamp01(tallyU * 3 - i);
                  const y = 470 + i * 34;
                  return (
                    <g key={t.label}>
                      <text x={168} y={y + 14} textAnchor="end" fill={t.color} fontSize={14}>{t.label}</text>
                      <rect x={180} y={y} width={Math.max(2, w)} height={18} rx={4} fill={t.color} opacity={0.65} />
                      <text x={188 + w} y={y + 14} fill={t.color} fontSize={13} fontFamily="monospace">{t.n}</text>
                    </g>
                  );
                })}
                <text x={92} y={452} fill={colors.MUTED} fontSize={11} fontFamily="monospace">tallied by YOUR client</text>
              </g>
            )}
          </g>

          {/* followers lane */}
          {repostU > 0 && (
            <g opacity={clamp01(repostU * 2)}>
              <line x1={LANE_X - 130} y1={110} x2={LANE_X - 130} y2={560} stroke={colors.GRID} strokeWidth={1} opacity={0.7} />
              <text x={LANE_X} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                bob’s followers see
              </text>
            </g>
          )}
          {/* the repost: note shrinks into a kind-6 envelope and travels */}
          {repostU > 0 && (() => {
            const p = flightPos({ x: NOTE.x, y: NOTE.y }, REPOST_DEST, repostU, 120);
            const sc = 1 - 0.45 * repostU;
            return (
              <g transform={`translate(${p.x}, ${p.y}) scale(${sc})`} opacity={Math.min(1, repostU * 2)}>
                <rect x={-118} y={-64} width={236} height={128} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
                <text x={-100} y={-40} fill={colors.POSITIVE} fontSize={13} fontWeight={600}>bob · kind 6 repost</text>
                <rect x={-100} y={-26} width={200} height={58} rx={8} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1} opacity={0.9} />
                <text x={-88} y={-6} fill={colors.MUTED} fontSize={10} fontFamily="monospace">content = the whole note,</text>
                <text x={-88} y={10} fill={colors.MUTED} fontSize={10} fontFamily="monospace">stringified</text>
                <text x={-100} y={52} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                  e {shortHex(NOTE_ID, 6, 2)} wss://relay…
                </text>
              </g>
            );
          })()}
          {kindsU > 0 && (
            <g opacity={kindsU}>
              <rect x={LANE_X - 92} y={340} width={184} height={44} rx={9} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={LANE_X} y={358} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="monospace">kind 16 — anything else</text>
              <text x={LANE_X} y={375} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">k "30023"</text>
            </g>
          )}

          {/* the quote */}
          {quoteU > 0 && (
            <g opacity={quoteU}>
              <rect x={92} y={548} width={340} height={96} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
              <text x={108} y={572} fill={colors.SECONDARY} fontSize={12} fontWeight={600}>carol · kind 1 quote</text>
              <text x={108} y={592} fill={colors.TEXT} fontSize={11.5}>this is why onboarding matters →</text>
              <rect x={108} y={600} width={180} height={34} rx={6} fill={colors.BG} stroke={colors.ACCENT} opacity={0.9} />
              <text x={118} y={621} fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">alice’s note, embedded</text>
              <rect x={302} y={600} width={116} height={34} rx={6} fill={colors.BG} stroke={colors.SECONDARY} />
              <text x={310} y={621} fill={colors.SECONDARY} fontSize={9.5} fontFamily="monospace">q {shortHex(NOTE_ID, 4, 2)}</text>
            </g>
          )}
          {gateU > 0 && (
            <g opacity={gateU}>
              <path
                d={`M${430},${586} Q ${520},${560} ${560},${470}`}
                fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} strokeDasharray="5 5"
              />
              <line x1={548} y1={492} x2={584} y2={452} stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <line x1={584} y1={492} x2={548} y2={452} stroke={colors.NEGATIVE} strokeWidth={2.4} />
              <text x={604} y={470} fill={colors.NEGATIVE} fontSize={11.5}>
                q ≠ e — never enters the thread
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A vocabulary, not a platform
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            like · boost · quote — all just events pointing at events
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-25 kind 7 · NIP-18 kinds 6/16 · q tag
          </text>
        </g>
      )}
    </>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
