// The Article Is an Event — NIP-23, chapter 1.
//
// Grounded in NIP-23: kind 30023 addressable articles; content is markdown
// with two MUSTs ("MUST NOT hard line-break paragraphs", "MUST NOT support
// adding HTML to Markdown"); standardized tags d/title/image/summary/
// published_at/t; created_at moves with each edit.
//
// ONE machine: a rendered article page (left) and its kind-30023 event
// (right). The page FOLDS into the event tag by tag — headline into the title
// tag, abstract into summary, topics into t tags, the whole markdown body
// into the content string — then unfolds back, because the event IS the
// article. Two linter beats act out the spec's MUSTs.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The article and its event (module scope)
// ---------------------------------------------------------------------------
const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';

const EVENT = {
  kind: 30023,
  pubkey: PUBKEY,
  created_at: 1700860000,
  tags: [
    ['d', 'why-relays'],
    ['title', 'Why Relays Matter'],
    ['summary', 'Dumb pipes, durable words.'],
    ['published_at', '1699000000'],
    ['t', 'nostr'],
    ['t', 'infrastructure'],
  ],
  content: '# Why Relays Matter\\n\\nEvery post you have ever…',
};

export const ARTICLE_LAYOUT = layoutJson(EVENT, {
  x: 590,
  y: 96,
  fontSize: 14,
  inlineArrayMax: 40,
  abbrev: (_p, raw) => (raw.length > 34 ? `${raw.slice(0, 31)}…` : raw.length > 26 && /^[0-9a-f]+$/.test(raw) ? shortHex(raw) : raw),
});

// article page (left)
const PAGE = { x: 80, y: 100, w: 400, h: 470 };
const TITLE_POS = { x: PAGE.x + 24, y: PAGE.y + 52 };
const SUMMARY_POS = { x: PAGE.x + 24, y: PAGE.y + 148 };
const TOPIC_POS = [
  { x: PAGE.x + 44, y: PAGE.y + 190 },
  { x: PAGE.x + 128, y: PAGE.y + 190 },
];
// grey body bars (the markdown text)
const BODY_BARS = Array.from({ length: 9 }, (_, i) => ({
  x: PAGE.x + 24,
  y: PAGE.y + 232 + i * 24,
  w: [352, 340, 300, 352, 328, 344, 260, 352, 180][i],
}));

// fold flights: page element → JSON value slot
const FOLDS = [
  { from: TITLE_POS, path: 'tags[1][1]', text: 'Why Relays Matter', color: colors.POSITIVE },
  { from: SUMMARY_POS, path: 'tags[2][1]', text: 'Dumb pipes, durable words.', color: colors.POSITIVE },
  { from: TOPIC_POS[0], path: 'tags[4][1]', text: 'nostr', color: colors.POSITIVE },
  { from: TOPIC_POS[1], path: 'tags[5][1]', text: 'infrastructure', color: colors.POSITIVE },
];

const CAM_PAGE: CameraState = { x: 330, y: 330, k: 1.25 };
const CAM_JSON: CameraState = { x: 800, y: 300, k: 1.2 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pageU = tl.channel('pageU', 0);
  const jsonU = tl.channel('jsonU', 0);
  const foldU = tl.channel('foldU', 0);
  const bodyU = tl.channel('bodyU', 0);
  const wrapU = tl.channel('wrapU', 0);
  const wrapFixU = tl.channel('wrapFixU', 0);
  const htmlU = tl.channel('htmlU', 0);
  const clocksU = tl.channel('clocksU', 0);
  const unfoldU = tl.channel('unfoldU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — a finished article.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is a finished article: a headline, an abstract, two topics, and a few thousand words of markdown. On nostr, every bit of it is about to live inside one event.',
  });
  tl.tween(pageU, 1, { at: 0.7, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAM_PAGE, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — the fold begins.
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'The long-form spec gives it kind 30023. Watch the page fold into the event: the headline becomes a title tag, the abstract a summary tag, each topic a t tag.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(jsonU, 1, { at: 7.4, dur: 1.8, ease: ease.draw });
  tl.tween(foldU, 1, { at: 9.0, dur: 3.2, ease: ease.linear });
  tl.hold(13.0, 0.7);

  // Beat 3 — the body is the content string.
  tl.caption({
    at: 13.7,
    dur: 6.0,
    text: 'And the body itself — the entire markdown text — becomes the content string. There is no attachment and no database row: the article you read is a string a relay stores.',
  });
  tl.tween(bodyU, 1, { at: 14.6, dur: 2.2, ease: ease.move });
  tl.hold(19.7, 0.7);

  // Beat 4 — MUST number one: no hard line breaks.
  tl.caption({
    at: 20.4,
    dur: 6.2,
    text: 'Two hard rules keep that string portable. First: paragraphs must not be hard line-broken at some arbitrary column — the text flows, and every screen wraps it its own way.',
  });
  tl.tween(cam, CAM_JSON, { at: 20.6, dur: 1.4, ease: ease.move });
  tl.tween(wrapU, 1, { at: 21.6, dur: 0.8, ease: ease.enter });
  tl.tween(wrapFixU, 1, { at: 24.4, dur: 1.2, ease: ease.move });
  tl.hold(26.6, 0.7);

  // Beat 5 — MUST number two: no HTML.
  tl.caption({
    at: 27.3,
    dur: 5.8,
    text: 'Second: raw web markup must not ride along inside the markdown. Markdown in, markdown out — a client, not the author, decides how it renders.',
  });
  tl.tween(htmlU, 1, { at: 28.2, dur: 1.0, ease: ease.enter });
  tl.hold(33.1, 0.7);

  // Beat 6 — two clocks.
  tl.caption({
    at: 33.8,
    dur: 5.8,
    text: 'Notice two clocks. The published-at tag remembers the first publication, forever. The created-at field moves with every edit. One is history; the other is freshness.',
  });
  tl.tween(clocksU, 1, { at: 34.6, dur: 1.2, ease: ease.enter });
  tl.hold(39.6, 0.7);

  // Beat 7 — the unfold.
  tl.caption({
    at: 40.3,
    dur: 5.8,
    text: 'And the fold runs backwards. Any client that finds this event can rebuild the whole page from its tags and its content string. The event is not a copy of the article — it is the article.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.5, dur: 1.4, ease: ease.move });
  tl.tween(unfoldU, 1, { at: 41.4, dur: 2.4, ease: ease.linear });
  tl.hold(46.1, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 46.8,
    dur: 5.4,
    text: 'One event, kind 30023: the article travels as data. Next question — if the author fixes a typo tomorrow, what happens to every link that pointed here today?',
  });
  tl.tween(dimU, 1, { at: 47.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.2, dur: 1.0, ease: ease.enter });
  tl.hold(52.2, 1.2);

  return {
    tl, cam, pageU, jsonU, foldU, bodyU, wrapU, wrapFixU,
    htmlU, clocksU, unfoldU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pageU = s.get(scene.pageU);
  const jsonU = s.get(scene.jsonU);
  const foldU = s.get(scene.foldU);
  const bodyU = s.get(scene.bodyU);
  const wrapU = s.get(scene.wrapU);
  const wrapFixU = s.get(scene.wrapFixU);
  const htmlU = s.get(scene.htmlU);
  const clocksU = s.get(scene.clocksU);
  const unfoldU = s.get(scene.unfoldU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // once the page has folded into the JSON, the MUST demos own the frame —
  // fade the (off-camera) page so it doesn't hang half-visible, then restore
  // it for the unfold beat where the page is rebuilt.
  const pageFade = 1 - 0.82 * clamp01(wrapU) * (1 - clamp01(unfoldU));
  const back = clamp01(unfoldU);
  // per-fold progress, reversed by the unfold
  const fu = (i: number) => clamp01(foldU * FOLDS.length - i) * (1 - clamp01(back * FOLDS.length - i));
  const bodyFold = clamp01(bodyU) * (1 - back);
  const hidden = [
    ...FOLDS.filter((_, i) => fu(i) > 0 && fu(i) < 1).map((f) => f.path),
    ...(bodyFold > 0 && bodyFold < 1 ? ['content'] : []),
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the article page */}
          {pageU > 0 && (
            <g opacity={pageU * pageFade}>
              <rect x={PAGE.x} y={PAGE.y} width={PAGE.w} height={PAGE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={TITLE_POS.x} y={TITLE_POS.y} fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={1 - 0.85 * fu(0)}>
                Why Relays Matter
              </text>
              <rect x={PAGE.x + 24} y={PAGE.y + 70} width={352} height={54} rx={8} fill={colors.GRID} opacity={0.4} />
              <text x={PAGE.x + 200} y={PAGE.y + 102} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                cover image
              </text>
              <text x={SUMMARY_POS.x} y={SUMMARY_POS.y} fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={1 - 0.85 * fu(1)}>
                Dumb pipes, durable words.
              </text>
              {['nostr', 'infrastructure'].map((t, i) => (
                <g key={t} opacity={1 - 0.85 * fu(2 + i)}>
                  <rect x={TOPIC_POS[i].x - 24} y={TOPIC_POS[i].y - 14} width={t.length * 7 + 22} height={20} rx={10} fill="none" stroke={colors.SECONDARY} opacity={0.7} />
                  <text x={TOPIC_POS[i].x - 13} y={TOPIC_POS[i].y} fill={colors.SECONDARY} fontSize={12}>
                    {t}
                  </text>
                </g>
              ))}
              {BODY_BARS.map((b, i) => (
                <rect
                  key={i}
                  x={b.x}
                  y={b.y}
                  width={b.w * (1 - 0.9 * bodyFold)}
                  height={10}
                  rx={5}
                  fill={colors.MUTED}
                  opacity={0.35 * (1 - 0.7 * bodyFold)}
                />
              ))}
            </g>
          )}

          {/* the event */}
          <JsonDoc layout={ARTICLE_LAYOUT} reveal={jsonU} hidden={hidden.length ? hidden : undefined} />

          {/* fold flights */}
          {FOLDS.map((f, i) => {
            const u = fu(i);
            if (u <= 0 || u >= 1) return null;
            const a = ARTICLE_LAYOUT.anchor(f.path);
            return (
              <TokenFlight
                key={f.path}
                from={{ x: f.from.x + 60, y: f.from.y }}
                to={{ x: a.cx, y: a.cy + 5 }}
                u={u}
                text={f.text}
                fill={f.color}
                fontSize={13}
                lift={60}
              />
            );
          })}
          {bodyFold > 0 && bodyFold < 1 && (
            <TokenFlight
              from={{ x: PAGE.x + 200, y: PAGE.y + 330 }}
              to={{ x: ARTICLE_LAYOUT.anchor('content').cx, y: ARTICLE_LAYOUT.anchor('content').cy + 5 }}
              u={bodyFold}
              text="# Why Relays Matter…"
              fill={colors.POSITIVE}
              fontSize={13}
              lift={90}
            />
          )}

          {/* MUST #1 — hard-wrapped text rejected, then reflowed */}
          {wrapU > 0 && (
            <g opacity={wrapU * (1 - 0.9 * clamp01(htmlU * 1.4))}>
              <rect x={620} y={430} width={470} height={104} rx={10} fill={colors.PANEL} stroke={wrapFixU >= 1 ? colors.POSITIVE : colors.NEGATIVE} />
              <text x={640} y={456} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                {wrapFixU >= 1 ? 'one flowing paragraph — wraps per screen' : 'hard-wrapped at column 80 — MUST NOT'}
              </text>
              {wrapFixU < 1 ? (
                [0, 1, 2].map((i) => (
                  <rect key={i} x={640} y={470 + i * 18} width={i === 2 ? 180 : 320} height={9} rx={4} fill={colors.NEGATIVE} opacity={0.5} />
                ))
              ) : (
                <rect x={640} y={474} width={430 * clamp01(wrapFixU)} height={9} rx={4} fill={colors.POSITIVE} opacity={0.6} />
              )}
              {wrapFixU < 1 && (
                <text x={1076} y={460} textAnchor="end" fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                  ✕
                </text>
              )}
            </g>
          )}

          {/* MUST #2 — HTML bounced */}
          {htmlU > 0 && (
            <g opacity={htmlU}>
              <rect x={620} y={430} width={470} height={104} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={640} y={462} fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace">
                {'<div onclick=…>'}
              </text>
              <text x={640} y={490} fill={colors.MUTED} fontSize={12}>
                markup in markdown — MUST NOT: rendering belongs to the reader
              </text>
              <line x1={620} y1={430} x2={1090} y2={534} stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.7} />
            </g>
          )}

          {/* two clocks */}
          {clocksU > 0 && (
            <g opacity={clocksU}>
              <rect x={120} y={588} width={300} height={30} rx={8} fill="none" stroke={colors.WARM} opacity={0.7} />
              <text x={136} y={608} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                published_at 1699000000 — history
              </text>
              <rect x={440} y={588} width={296} height={30} rx={8} fill="none" stroke={colors.ACCENT} opacity={0.7} />
              <text x={456} y={608} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
                created_at 1700860000 — freshness
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The event is the article
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            kind 30023 · title, summary, topics as tags · the markdown as content
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-23 — long-form content
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
