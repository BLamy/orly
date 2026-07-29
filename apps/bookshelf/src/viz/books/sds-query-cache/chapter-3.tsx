// Stale, Missed, and Sharded
//
// Backed by: solutions/system_design/query_cache/README.md — the cache-miss
// flow in Step 3 (Query API → Reverse Index Service finds and ranks matching
// documents → Document Service returns titles and snippets → memory_cache.set
// places the entry at the front of the LRU list); "When to update the cache"
// (page contents change, pages added or removed, page rank changes → set a max
// time to live, TTL; the approach is cache-aside); and Step 4 "Expanding the
// Memory Cache to many machines" (three options: each machine its own cache /
// each machine a full copy / shard across the cluster with machine =
// hash(query), likely with consistent hashing).
//
// ONE machine across three acts: the cache panel persists center stage. Act
// one, a miss flows around it and the answer is written back in. Act two, TTL
// clocks drain on its entries and a stale answer dies on schedule. Act three,
// the panel splits into a sharded cluster and queries route by hash.
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
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// layout
const API = { x: 190, y: 330 } as const;
const CACHE = { x: 570, y: 330, w: 300, h: 210 } as const;
const IDX = { x: 1060, y: 220 } as const;
const DOC = { x: 1060, y: 440 } as const;

const ENTRIES = [
  { q: 'best AND coffee AND sf', ttl: 0.9 },
  { q: 'weather AND nyc', ttl: 0.55 },
  { q: 'world AND cup AND final', ttl: 0.22 }, // the one that goes stale
] as const;

// rank bars the reverse index returns (top ranked docs)
const RANKS = [0.95, 0.8, 0.62, 0.45, 0.3];

// sharded cluster
const SHARDS = [
  { x: 430, y: 330, label: 'shard 0' },
  { x: 640, y: 330, label: 'shard 1' },
  { x: 850, y: 330, label: 'shard 2' },
] as const;
// three routed queries → shard index (illustrating machine = hash(query))
const ROUTED = [
  { label: 'hash(q1) % 3 = 2', shard: 2 },
  { label: 'hash(q2) % 3 = 0', shard: 0 },
  { label: 'hash(q3) % 3 = 1', shard: 1 },
] as const;

const CAM_MISS: CameraState = { x: 640, y: 330, k: 1.1 };
const CAM_CACHE: CameraState = { x: 570, y: 330, k: 1.45 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stageU: ChannelRef<number>;
  missX: ChannelRef<number>;
  toIdx: ChannelRef<number>;
  rankU: ChannelRef<number>;
  toDoc: ChannelRef<number>;
  setU: ChannelRef<number>;
  ttlU: ChannelRef<number>;
  staleU: ChannelRef<number>;
  worldU: ChannelRef<number>;
  splitU: ChannelRef<number>;
  routeU: ChannelRef<number>;
  optU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stageU = tl.channel('stageU', 0); // api + cache + services reveal
  const missX = tl.channel('missX', 0); // query api → cache, bounces (miss)
  const toIdx = tl.channel('toIdx', 0); // api → reverse index round trip
  const rankU = tl.channel('rankU', 0); // rank bars
  const toDoc = tl.channel('toDoc', 0); // api → document service round trip
  const setU = tl.channel('setU', 0); // entry written into cache
  const ttlU = tl.channel('ttlU', 0); // clocks drain
  const staleU = tl.channel('staleU', 0); // stale entry dies
  const worldU = tl.channel('worldU', 0); // "the page changed" pulse
  const splitU = tl.channel('splitU', 0); // cache → sharded cluster morph
  const routeU = tl.channel('routeU', 0); // hash-routed packets
  const optU = tl.channel('optU', 0); // the two rejected options
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the miss —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Every cache lives on a simple promise: ask me first. So watch what happens when the answer is not there.',
  });
  tl.tween(stageU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_MISS, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(missX, 1, { at: 4.4, dur: 2.0, ease: ease.linear });
  tl.hold(7.0, 0.5);

  // — Beat 2 · reverse index —
  tl.caption({
    at: 7.5,
    dur: 7,
    text: 'On a miss, the query service falls back to the reverse index service, which finds every document matching the terms and ranks them, best first.',
  });
  tl.tween(toIdx, 1, { at: 8.2, dur: 2.6, ease: ease.linear });
  tl.tween(rankU, 1, { at: 10.4, dur: 1.8, ease: ease.draw });
  tl.hold(14.5, 0.5);

  // — Beat 3 · document service —
  tl.caption({
    at: 15.0,
    dur: 6,
    text: 'Then the document service turns those ranked matches into something a person can read: a title and a snippet for each result.',
  });
  tl.tween(toDoc, 1, { at: 15.6, dur: 2.6, ease: ease.linear });
  tl.hold(21.0, 0.5);

  // — Beat 4 · cache aside —
  tl.caption({
    at: 21.5,
    dur: 7,
    text: 'Before the answer leaves, it is written into the cache at the front of the list. This pattern is called cache aside: the cache only ever holds answers somebody actually asked for.',
  });
  tl.tween(cam, CAM_CACHE, { at: 21.7, dur: 1.4, ease: ease.move });
  tl.tween(setU, 1, { at: 22.6, dur: 1.6, ease: ease.move });
  tl.hold(28.5, 0.5);

  // — Beat 5 · staleness —
  tl.caption({
    at: 29.0,
    dur: 6.5,
    text: 'But a stored answer is a photograph, and the web keeps moving. Pages change, pages vanish, rankings shift. A cached answer can quietly become a lie.',
  });
  tl.tween(worldU, 1, { at: 30.4, dur: 0.8, ease: ease.pop });
  tl.tween(worldU, 0.35, { at: 33.0, dur: 1.2, ease: ease.move });
  tl.hold(35.5, 0.5);

  // — Beat 6 · TTL —
  tl.caption({
    at: 36.0,
    dur: 7,
    text: 'The straightforward defense is a time to live. Every entry gets a clock when it is written. When the clock runs out, the entry expires, and the next request recomputes it fresh.',
  });
  tl.tween(ttlU, 1, { at: 36.8, dur: 4.4, ease: ease.linear });
  tl.tween(staleU, 1, { at: 41.4, dur: 1.2, ease: ease.move });
  tl.hold(43.5, 0.5);

  // — Beat 7 · one box is not enough —
  tl.caption({
    at: 44.0,
    dur: 6,
    text: 'One more problem: four thousand requests a second and terabytes of possible entries will not fit in one machine. The cache itself has to scale out.',
  });
  tl.tween(cam, CAM_WIDE, { at: 44.2, dur: 1.5, ease: ease.move });
  tl.tween(splitU, 1, { at: 45.6, dur: 1.8, ease: ease.move });
  tl.hold(50.0, 0.5);

  // — Beat 8 · the options —
  tl.caption({
    at: 50.5,
    dur: 7.5,
    text: 'Give each machine its own private cache, and most requests miss. Give each machine a full copy, and you pay for the same memory many times. The design that wins is sharding.',
  });
  tl.tween(optU, 1, { at: 51.0, dur: 1.2, ease: ease.enter });
  tl.hold(58.0, 0.5);

  // — Beat 9 · shard by hash —
  tl.caption({
    at: 58.5,
    dur: 7,
    text: 'Hash the query, and the hash picks the machine. Every query has exactly one home, the whole cluster acts as one big cache, and no byte is stored twice.',
  });
  tl.tween(optU, 0.15, { at: 58.7, dur: 1.0, ease: ease.move });
  tl.tween(routeU, 1, { at: 59.4, dur: 4.4, ease: ease.linear });
  tl.hold(65.5, 0.5);

  // — Beat 10 · recap —
  tl.caption({
    at: 66.0,
    dur: 8,
    text: 'And that is the whole design. Parse the query into a canonical key. Serve repeats from memory in microseconds. On a miss, compute once and cache aside. Expire on a clock, evict the least recently used, and shard by hash when one box runs out.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 66.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 66.8, dur: 1.4, ease: ease.move });
  tl.hold(74.5, 1.5);

  return { tl, cam, stageU, missX, toIdx, rankU, toDoc, setU, ttlU, staleU, worldU, splitU, routeU, optU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Box({ x, y, w = 180, h = 62, title, sub, stroke = colors.GRID, opacity = 1 }: {
  x: number; y: number; w?: number; h?: number; title: string; sub?: string; stroke?: string; opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.3} />
      <text x={x} y={y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

/** TTL arc — a draining clock */
function TtlArc({ cx, cy, r, u, color }: { cx: number; cy: number; r: number; u: number; color: string }) {
  const frac = Math.max(0.001, 1 - u);
  const a = frac * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cy - r * Math.cos(a);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.GRID} strokeWidth={1.5} />
      <path d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y} Z`} fill={color} opacity={0.7} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stageU = s.get(scene.stageU);
  const missX = s.get(scene.missX);
  const toIdx = s.get(scene.toIdx);
  const rankU = s.get(scene.rankU);
  const toDoc = s.get(scene.toDoc);
  const setU = s.get(scene.setU);
  const ttlU = s.get(scene.ttlU);
  const staleU = s.get(scene.staleU);
  const worldU = s.get(scene.worldU);
  const splitU = s.get(scene.splitU);
  const routeU = s.get(scene.routeU);
  const optU = s.get(scene.optU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const single = 1 - splitU; // single-cache act opacity
  const missOut = clamp01(missX * 2); // toward cache
  const missBack = clamp01(missX * 2 - 1); // bounce back
  const idxOut = clamp01(toIdx * 2);
  const idxBack = clamp01(toIdx * 2 - 1);
  const docOut = clamp01(toDoc * 2);
  const docBack = clamp01(toDoc * 2 - 1);

  const cacheLeft = { x: CACHE.x - CACHE.w / 2, y: CACHE.y } as const;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* =================== act 1+2 · the single cache =================== */}
        <g opacity={stageU * single * dimAll}>
          <Box x={API.x} y={API.y} w={170} title="Query API" sub="process_query(query)" stroke={colors.ACCENT} />
          {/* the cache panel */}
          <rect x={CACHE.x - CACHE.w / 2} y={CACHE.y - CACHE.h / 2} width={CACHE.w} height={CACHE.h} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.6} />
          <text x={CACHE.x} y={CACHE.y - CACHE.h / 2 + 28} textAnchor="middle" fill={colors.POSITIVE} fontSize={14.5}>
            Memory Cache
          </text>
          {ENTRIES.map((e, i) => {
            const isNew = i === 0;
            const entryU = isNew ? setU : 1;
            const ttl = clamp01(ttlU * (0.4 + e.ttl));
            const dead = i === 2 && staleU > 0.5;
            const y = CACHE.y - CACHE.h / 2 + 52 + i * 46;
            return (
              <g key={i} opacity={entryU * (dead ? 0.18 : 1)}>
                <rect x={CACHE.x - CACHE.w / 2 + 16 - (1 - entryU) * 60} y={y} width={CACHE.w - 32} height={38} rx={8} fill={colors.BG} stroke={dead ? colors.NEGATIVE : isNew && setU < 1 ? colors.POSITIVE : colors.GRID} strokeWidth={1.2} />
                <text x={CACHE.x - CACHE.w / 2 + 28} y={y + 24} fill={dead ? colors.NEGATIVE : colors.TEXT} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {e.q}
                </text>
                {ttlU > 0.02 && (
                  <TtlArc cx={CACHE.x + CACHE.w / 2 - 36} cy={y + 19} r={11} u={i === 2 ? Math.max(ttl, staleU) : ttl * 0.8} color={i === 2 ? colors.NEGATIVE : colors.WARM} />
                )}
              </g>
            );
          })}
          {ttlU > 0.02 && (
            <text x={CACHE.x} y={CACHE.y + CACHE.h / 2 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
              TTL — max time an entry may live
            </text>
          )}
          {/* services */}
          <Box x={IDX.x} y={IDX.y} w={200} title="Reverse Index Service" sub="find + rank matches" stroke={colors.WARM} />
          <Box x={DOC.x} y={DOC.y} w={200} title="Document Service" sub="titles + snippets" stroke={colors.WARM} />
          {/* wires */}
          <line x1={API.x + 85} y1={API.y} x2={cacheLeft.x} y2={cacheLeft.y} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={API.x + 60} y1={API.y - 26} x2={IDX.x - 100} y2={IDX.y} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
          <line x1={API.x + 60} y1={API.y + 26} x2={DOC.x - 100} y2={DOC.y} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />

          {/* rank bars beside the reverse index */}
          <g opacity={rankU}>
            {RANKS.map((r, i) => (
              <rect key={i} x={IDX.x - 80 + i * 34} y={IDX.y + 44 + (1 - r) * 30} width={22} height={r * 42 * rankU} rx={4} fill={colors.WARM} opacity={0.85 - i * 0.13} />
            ))}
          </g>
          {/* snippet chips beside the document service */}
          <g opacity={docBack}>
            {[0, 1].map((i) => (
              <g key={i}>
                <rect x={DOC.x - 88 + i * 96} y={DOC.y + 44} width={86} height={34} rx={6} fill={colors.BG} stroke={colors.GRID} />
                <rect x={DOC.x - 80 + i * 96} y={DOC.y + 52} width={54} height={5} rx={2.5} fill={colors.TEXT} opacity={0.8} />
                <rect x={DOC.x - 80 + i * 96} y={DOC.y + 63} width={68} height={4} rx={2} fill={colors.MUTED} opacity={0.7} />
              </g>
            ))}
          </g>
          {/* the world-changed pulse */}
          <g opacity={worldU}>
            <circle cx={IDX.x + 88} cy={IDX.y - 40} r={9} fill={colors.NEGATIVE} opacity={0.9} />
            <text x={IDX.x + 74} y={IDX.y - 56} textAnchor="end" fill={colors.NEGATIVE} fontSize={11.5}>
              page contents changed
            </text>
          </g>
        </g>

        {/* act-1 packets */}
        {single > 0.5 && (
          <>
            {missOut > 0 && missOut < 1 && (
              <Packet from={{ x: API.x + 85, y: API.y }} to={{ x: cacheLeft.x, y: cacheLeft.y }} u={missOut} r={6.5} color={colors.ACCENT} />
            )}
            {missBack > 0 && missBack < 1 && (
              <>
                <Packet from={{ x: cacheLeft.x, y: cacheLeft.y }} to={{ x: API.x + 85, y: API.y }} u={missBack} r={6.5} color={colors.NEGATIVE} />
                <text x={(cacheLeft.x + API.x + 85) / 2} y={API.y - 18} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily="ui-monospace, monospace" opacity={dimAll}>
                  get(query) → None
                </text>
              </>
            )}
            {idxOut > 0 && idxOut < 1 && (
              <Packet from={{ x: API.x + 60, y: API.y - 26 }} to={{ x: IDX.x - 100, y: IDX.y }} u={idxOut} r={6} color={colors.WARM} />
            )}
            {idxBack > 0 && idxBack < 1 && (
              <Packet from={{ x: IDX.x - 100, y: IDX.y }} to={{ x: API.x + 60, y: API.y - 26 }} u={idxBack} r={6} color={colors.POSITIVE} />
            )}
            {docOut > 0 && docOut < 1 && (
              <Packet from={{ x: API.x + 60, y: API.y + 26 }} to={{ x: DOC.x - 100, y: DOC.y }} u={docOut} r={6} color={colors.WARM} />
            )}
            {docBack > 0 && docBack < 1 && (
              <Packet from={{ x: DOC.x - 100, y: DOC.y }} to={{ x: API.x + 60, y: API.y + 26 }} u={docBack} r={6} color={colors.POSITIVE} />
            )}
            {setU > 0 && setU < 1 && (
              <Packet from={{ x: API.x + 85, y: API.y }} to={{ x: cacheLeft.x + 30, y: CACHE.y - CACHE.h / 2 + 70 }} u={setU} r={7} color={colors.POSITIVE} />
            )}
          </>
        )}

        {/* =================== act 3 · the sharded cluster =================== */}
        <g opacity={splitU * dimAll}>
          {/* rejected options, whispered */}
          <g opacity={optU}>
            <text x={640} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              own cache per machine → low hit rate · full copy per machine → wasted memory
            </text>
          </g>
          {SHARDS.map((sh, i) => (
            <g key={i}>
              <rect x={sh.x - 85} y={sh.y - 70} width={170} height={140} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text x={sh.x} y={sh.y - 46} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                {sh.label}
              </text>
              {[0, 1, 2].map((r) => (
                <rect key={r} x={sh.x - 65} y={sh.y - 28 + r * 30} width={130} height={22} rx={5} fill={colors.BG} stroke={colors.GRID} />
              ))}
            </g>
          ))}
          <text x={640} y={470} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, monospace">
            machine = hash(query) · consistent hashing
          </text>
          {/* hash-routed packets from the api position */}
          {ROUTED.map((rt, i) => {
            const u = clamp01(routeU * 3.4 - i * 1.05);
            if (u <= 0 || u >= 1) return null;
            const target = SHARDS[rt.shard];
            return (
              <g key={i}>
                <Packet from={{ x: 150, y: 560 }} to={{ x: target.x, y: target.y + 78 }} u={u} r={7} color={colors.ACCENT} />
                <text x={150} y={596} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  {rt.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={250} y={190} width={780} height={290} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={240} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the query cache, complete
          </text>
          {[
            ['parse', 'one canonical key per question'],
            ['hit', 'answer from memory, move to front'],
            ['miss', 'reverse index + documents, then cache aside'],
            ['expire', 'TTL clocks, LRU eviction'],
            ['scale', 'shard the cluster by hash of the query'],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={430} y={286 + i * 36} textAnchor="end" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
                {k}
              </text>
              <text x={460} y={286 + i * 36} fill={colors.MUTED} fontSize={13.5}>
                {v}
              </text>
            </g>
          ))}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
