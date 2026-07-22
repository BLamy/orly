// Nostr Implementation Possibilities №5 — The Relay, chapter 3.
// NIP-45 (COUNT): ["COUNT", id, filters…] → ["COUNT", id, {"count": n,
// "approximate"?: bool, "hll"?: hex}] — numbers without downloads, and
// HyperLogLog sketches that merge across relays. NIP-50 (search): the
// "search" filter field, relevance ordering (limit AFTER scoring), and
// key:value extensions relays may ignore. Shapes are the specs' own.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, layoutJson } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// the naive REQ's event downpour — precomputed positions, seeded
const rand = mulberry32(45);
const DOTS = Array.from({ length: 140 }, () => ({
  x: 180 + rand() * 380,
  y: 150 + rand() * 330,
  r: 2.5 + rand() * 2.5,
}));

export const COUNT_REQ = {
  verb: 'COUNT',
  id: 'howmany',
  filter: { kinds: [7], '#e': ['91c3…'] },
};

const REQ_LAYOUT = layoutJson(
  { search: 'best nostr apps', kinds: [1] },
  { x: 700, y: 396, fontSize: 14, inlineArrayMax: 40 },
);

// three relays' HLL sketches merging
const RELAYS = [
  { label: 'relay A', count: 2044, x: 760, y: 150 },
  { label: 'relay B', count: 1567, x: 950, y: 150 },
  { label: 'relay C', count: 901, x: 1140, y: 150 },
];

// search results with relevance scores (precomputed, sorted)
const RESULTS = [
  { text: 'the best nostr apps, ranked', score: 0.97 },
  { text: 'apps I actually use on nostr', score: 0.81 },
  { text: 'best clients? depends on the phone', score: 0.64 },
  { text: 'gm — new app day', score: 0.22 },
];

const CAM_LEFT: CameraState = { x: 380, y: 320, k: 1.2 };
const CAM_RIGHT: CameraState = { x: 900, y: 330, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  reqU: ChannelRef<number>;
  pourU: ChannelRef<number>;
  countU: ChannelRef<number>;
  replyU: ChannelRef<number>;
  hllU: ChannelRef<number>;
  mergeU: ChannelRef<number>;
  searchU: ChannelRef<number>;
  rankU: ChannelRef<number>;
  extU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const reqU = tl.channel('reqU', 0);
  const pourU = tl.channel('pourU', 0);
  const countU = tl.channel('countU', 0);
  const replyU = tl.channel('replyU', 0);
  const hllU = tl.channel('hllU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const searchU = tl.channel('searchU', 0);
  const rankU = tl.channel('rankU', 0);
  const extU = tl.channel('extU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Suppose you only want a number. How many people reacted to this note? The basic protocol has one answer: subscribe, and let the relay pour every single matching event over the wire.',
  });
  tl.tween(cam, CAM_LEFT, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(reqU, 1, { at: 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(pourU, 1, { at: 1.8, dur: 3.6, ease: ease.linear });
  tl.hold(6.3, 0.7);

  tl.caption({
    at: 7.0,
    dur: 5.4,
    text: 'A hundred forty events downloaded, parsed, and thrown away — to learn the number one hundred forty. The forty-fifth proposal adds a verb for exactly this.',
  });
  tl.tween(countU, 1, { at: 8.4, dur: 1.2, ease: ease.move });
  tl.hold(12.4, 0.7);

  tl.caption({
    at: 13.1,
    dur: 5.8,
    text: 'Count takes the same filters a subscription would. The relay answers with one small object instead of a flood — and the whole downpour collapses into it.',
  });
  tl.tween(replyU, 1, { at: 14.2, dur: 1.8, ease: ease.move });
  tl.hold(18.9, 0.7);

  tl.caption({
    at: 19.6,
    dur: 6.0,
    text: 'For big numbers, honesty gets a field of its own: approximate, true. A relay counting ninety-three million events is estimating, and it says so.',
  });
  tl.tween(hllU, 1, { at: 20.8, dur: 1.4, ease: ease.enter });
  tl.hold(25.6, 0.7);

  tl.caption({
    at: 26.3,
    dur: 6.4,
    text: 'And for counting across relays there is a lovely trick: each relay ships a tiny counting sketch of who it saw. Sketches merge without double-counting the people every relay saw — three relays, one honest total.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 26.6, dur: 1.4, ease: ease.move });
  tl.tween(mergeU, 1, { at: 27.8, dur: 2.6, ease: ease.linear });
  tl.hold(32.7, 0.7);

  tl.caption({
    at: 33.4,
    dur: 5.6,
    text: 'The fiftieth proposal teaches filters one more word: search. A plain string, matched against event content — and suddenly a relay is a search engine.',
  });
  tl.tween(searchU, 1, { at: 34.4, dur: 1.6, ease: ease.draw });
  tl.hold(39.0, 0.7);

  tl.caption({
    at: 39.7,
    dur: 6.0,
    text: 'Search results break the oldest rule in the protocol: they come back ranked by relevance, not by time — and the limit is applied after scoring, so you get the best matches, not the newest.',
  });
  tl.tween(rankU, 1, { at: 40.6, dur: 2.4, ease: ease.linear });
  tl.hold(45.7, 0.7);

  tl.caption({
    at: 46.4,
    dur: 5.6,
    text: 'Extensions ride inside the string as key colon value — language, domain, spam switches. Relays that understand them, apply them. Relays that do not, simply ignore them. Nothing breaks.',
  });
  tl.tween(extU, 1, { at: 47.4, dur: 1.6, ease: ease.enter });
  tl.hold(52.0, 0.7);

  tl.caption({
    at: 52.7,
    dur: 5.0,
    text: 'Two small verbs, one theme: ask the relay for the answer, not for the raw material to compute it yourself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 52.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 53.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 54.2, dur: 1.0, ease: ease.enter });
  tl.hold(57.7, 1.2);

  return { tl, cam, reqU, pourU, countU, replyU, hllU, mergeU, searchU, rankU, extU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const reqU = s.get(scene.reqU);
  const pourU = s.get(scene.pourU);
  const countU = s.get(scene.countU);
  const replyU = s.get(scene.replyU);
  const hllU = s.get(scene.hllU);
  const mergeU = s.get(scene.mergeU);
  const searchU = s.get(scene.searchU);
  const rankU = s.get(scene.rankU);
  const extU = s.get(scene.extU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // the downpour collapses into the count pill
  const collapse = clamp01(replyU);
  const PILL = { x: 380, y: 330 };
  // the left column recedes once the camera parks on the merge/search field
  const leftOp = 1 - clamp01(mergeU * 1.6);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the naive REQ */}
          {reqU > 0 && (
            <text x={180} y={120} fill={countU > 0.5 ? colors.MUTED : colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, Menlo, monospace" opacity={reqU * (1 - 0.5 * countU) * leftOp}>
              ["REQ", "r", {'{'}"kinds":[7], "#e":["91c3…"]{'}'}]
            </text>
          )}
          {/* the downpour */}
          {DOTS.map((d, i) => {
            const u = clamp01(pourU * DOTS.length * 0.35 - i * 0.35);
            if (u <= 0) return null;
            const x = d.x + (PILL.x - d.x) * collapse;
            const y = d.y + (PILL.y - d.y) * collapse;
            return <circle key={i} cx={x} cy={y - (1 - u) * 40} r={d.r * (1 - 0.8 * collapse)} fill={colors.ACCENT} opacity={0.55 * u * (1 - 0.6 * collapse)} />;
          })}
          {pourU >= 1 && collapse < 1 && (
            <text x={380} y={510} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={1 - collapse}>
              140 full events on the wire — to learn "140"
            </text>
          )}

          {/* COUNT request + reply */}
          {countU > 0 && (
            <text x={180} y={148} fill={colors.WARM} fontSize={13.5} fontFamily="ui-monospace, Menlo, monospace" opacity={countU * leftOp}>
              ["COUNT", "r", {'{'}"kinds":[7], "#e":["91c3…"]{'}'}]
            </text>
          )}
          {replyU > 0 && (
            <g opacity={replyU * leftOp}>
              <rect x={PILL.x - 130} y={PILL.y - 26} width={260} height={52} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={PILL.x} y={PILL.y + 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontFamily="ui-monospace, Menlo, monospace">
                {'{"count": 140}'}
              </text>
            </g>
          )}
          {hllU > 0 && (
            <text x={PILL.x} y={PILL.y + 62} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontFamily="ui-monospace, Menlo, monospace" opacity={hllU * leftOp}>
              {'{"count": 93412452, "approximate": true}'}
            </text>
          )}

          {/* HLL merge */}
          {mergeU > 0 && (
            <g>
              {RELAYS.map((r, i) => {
                const u = clamp01(mergeU * 3 - i * 0.6);
                if (u <= 0) return null;
                return (
                  <g key={r.label} opacity={u}>
                    <rect x={r.x - 74} y={r.y - 24} width={148} height={48} rx={9} fill={colors.PANEL} stroke={colors.SECONDARY} />
                    <text x={r.x} y={r.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>{r.label}</text>
                    <text x={r.x} y={r.y + 14} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">
                      hll · {r.count}
                    </text>
                    <line x1={r.x} y1={r.y + 24} x2={950 + (r.x - 950) * (1 - clamp01(mergeU * 2 - 1))} y2={r.y + 24 + 76 * clamp01(mergeU * 2 - 1)} stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.7} />
                  </g>
                );
              })}
              {mergeU >= 1 && (
                <g>
                  <rect x={950 - 96} y={238} width={192} height={40} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
                  <text x={950} y={263} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily="ui-monospace, Menlo, monospace">
                    merged: 3 802
                  </text>
                  <text x={950} y={298} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                    union, not sum — shared reactors counted once
                  </text>
                </g>
              )}
            </g>
          )}

          {/* NIP-50 search */}
          <JsonDoc layout={REQ_LAYOUT} reveal={searchU} />
          {rankU > 0 && (
            <g>
              {RESULTS.map((res, i) => {
                const u = clamp01(rankU * RESULTS.length - i);
                if (u <= 0) return null;
                const y = 470 + i * 30;
                return (
                  <g key={res.text} opacity={u * (0.45 + 0.55 * res.score)}>
                    <rect x={700} y={y - 15} width={300 * res.score + 90} height={24} rx={6} fill={colors.PANEL} stroke={i === 0 ? colors.POSITIVE : colors.GRID} />
                    <text x={712} y={y + 2} fill={colors.TEXT} fontSize={11.5}>{res.text}</text>
                    <text x={700 + 300 * res.score + 78} y={y + 2} textAnchor="end" fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, Menlo, monospace">
                      {res.score.toFixed(2)}
                    </text>
                  </g>
                );
              })}
              {rankU >= 1 && (
                <text x={700} y={600} fill={colors.MUTED} fontSize={12} opacity={Math.min(1, (rankU - 0.9) * 10)}>
                  ranked by relevance · limit applied after scoring
                </text>
              )}
            </g>
          )}
          {extU > 0 && (
            <g opacity={extU}>
              {['language:en', 'domain:example.com', 'include:spam'].map((e, i) => (
                <g key={e}>
                  <rect x={700 + i * 152} y={352} width={140} height={26} rx={13} fill="none" stroke={colors.WARM} opacity={0.7} />
                  <text x={770 + i * 152} y={369} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, Menlo, monospace">
                    {e}
                  </text>
                </g>
              ))}
              <text x={700} y={340} fill={colors.MUTED} fontSize={11.5}>
                extensions — unsupported ones are simply ignored
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={235} width={840} height={185} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={303} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Ask for the answer, not the raw material
          </text>
          <text x={640} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            COUNT with honest approximation · search ranked by relevance
          </text>
          <text x={640} y={387} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-45 · NIP-50
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
