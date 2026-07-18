// Four Thousand Questions a Second: the serving path
//
// Backed by: solutions/system_design/query_cache/README.md (Step 1 constraints:
// 10 million users, 10 billion queries/month, 4,000 requests/s, 270-byte cache
// entries, 2.7 TB/month; Step 3 "cache hit" flow: Client → Web Server (reverse
// proxy) → Query API → Memory Cache / Reverse Index Service + Document Service;
// parse_query: remove markup, break into terms, fix typos, normalize case,
// convert to boolean operations; latency: 1 MB from memory ~250 µs, SSD 4x,
// disk 80x) and query_cache_snippets.py (QueryApi.parse_query/process_query).
//
// ONE machine: a rain of query dots pouring at a serving pipeline. We follow a
// single query through the pipeline, watch parse_query rewrite it stage by
// stage, price the backend work with a memory/SSD/disk latency race, then slot
// the Memory Cache in front — the hero of the book.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The rain of queries — precomputed drops, each a query hitting the service.
// ---------------------------------------------------------------------------

const rand = mulberry32(20260716);
const N_DROPS = 46;
const DROPS = Array.from({ length: N_DROPS }, (_, i) => ({
  x: 120 + rand() * 1040,
  delay: (i / N_DROPS) * 0.82 + rand() * 0.1,
  speed: 0.8 + rand() * 0.5,
  r: 3 + rand() * 3.5,
}));

// parse_query, staged — the real steps from the README, applied to one query.
const PARSE_STAGES = [
  { label: 'raw query', text: '<b>Best   Coffe in SF??</b>' },
  { label: 'remove markup', text: 'Best   Coffe in SF??' },
  { label: 'break into terms', text: 'Best · Coffe · in · SF' },
  { label: 'fix typos', text: 'Best · Coffee · in · SF' },
  { label: 'normalize capitalization', text: 'best · coffee · in · sf' },
  { label: 'boolean operations', text: 'best AND coffee AND sf' },
] as const;

// The latency race — README: 1 MB sequential read: memory ~250 µs, SSD 4x,
// disk 80x. Bar lengths on a log-ish scale so disk stays on stage.
const RACE = [
  { name: 'memory', us: 250, len: 190, color: colors.POSITIVE },
  { name: 'SSD (4x)', us: 1000, len: 420, color: colors.WARM },
  { name: 'disk (80x)', us: 20000, len: 880, color: colors.NEGATIVE },
] as const;

// Pipeline layout (left → right): client, web server, query api, backends.
const P = {
  client: { x: 170, y: 360 },
  web: { x: 420, y: 360 },
  api: { x: 680, y: 360 },
  idx: { x: 1020, y: 250 },
  doc: { x: 1020, y: 470 },
  cache: { x: 850, y: 360 },
} as const;

const CAM_PIPE: CameraState = { x: 620, y: 360, k: 1.12 };
const CAM_PARSE: CameraState = { x: 680, y: 300, k: 1.35 };
const CAM_BACK: CameraState = { x: 880, y: 360, k: 1.25 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rainU: ChannelRef<number>;
  statsU: ChannelRef<number>;
  pipeU: ChannelRef<number>;
  qU: ChannelRef<number>;
  parseK: ChannelRef<number>;
  backU: ChannelRef<number>;
  fanU: ChannelRef<number>;
  raceU: ChannelRef<number>;
  cacheU: ChannelRef<number>;
  hitU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rainU = tl.channel('rainU', 0); // queries raining in
  const statsU = tl.channel('statsU', 0); // the back-of-the-envelope chips
  const pipeU = tl.channel('pipeU', 0); // client → web → api reveal
  const qU = tl.channel('qU', 0); // our one query traveling the pipe
  const parseK = tl.channel('parseK', 0); // parse_query stage index 0..5
  const backU = tl.channel('backU', 0); // reverse index + doc services
  const fanU = tl.channel('fanU', 0); // api → services round trip
  const raceU = tl.channel('raceU', 0); // latency race sweep
  const cacheU = tl.channel('cacheU', 0); // memory cache slots in
  const hitU = tl.channel('hitU', 0); // a hit bounces off the cache
  const closeU = tl.channel('closeU', 0); // closing panel

  // — Beat 1 · the rain —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'You are asked to design a cache for a search service. Ten million people are typing questions at it, and the questions never stop falling.',
  });
  tl.tween(rainU, 1, { at: 0.7, dur: 3.0, ease: ease.linear });
  tl.hold(7.5, 0.5);

  // — Beat 2 · the numbers —
  tl.caption({
    at: 8.0,
    dur: 7,
    text: 'The envelope math says ten billion queries a month, which works out to four thousand requests every second, around the clock.',
  });
  tl.tween(statsU, 1, { at: 8.4, dur: 0.9, ease: ease.pop });
  tl.hold(15.0, 0.5);

  // — Beat 3 · the pipeline —
  tl.caption({
    at: 15.5,
    dur: 6.5,
    text: 'Follow one query in. It lands on a web server acting as a reverse proxy, which hands it to the query A P I service.',
  });
  tl.tween(cam, CAM_PIPE, { at: 15.7, dur: 1.4, ease: ease.move });
  tl.tween(pipeU, 1, { at: 15.9, dur: 1.6, ease: ease.draw });
  tl.tween(qU, 1, { at: 17.6, dur: 2.6, ease: ease.linear });
  tl.hold(22.0, 0.5);

  // — Beat 4-5 · parse_query —
  tl.caption({
    at: 22.5,
    dur: 7.5,
    text: 'Before anything is looked up, the query is parsed. Markup is stripped, the text breaks into terms, typos are fixed, and the capitalization is normalized.',
  });
  tl.tween(cam, CAM_PARSE, { at: 22.7, dur: 1.3, ease: ease.move });
  tl.set(parseK, 1, 24.2);
  tl.set(parseK, 2, 25.8);
  tl.set(parseK, 3, 27.4);
  tl.set(parseK, 4, 29.0);
  tl.caption({
    at: 30.5,
    dur: 5.5,
    text: 'Finally it becomes a boolean expression, a clean canonical key. Two people asking the same thing in different ways can now hit the same answer.',
  });
  tl.set(parseK, 5, 31.5);
  tl.hold(36.0, 0.5);

  // — Beat 6 · the expensive path —
  tl.caption({
    at: 36.5,
    dur: 7.5,
    text: 'Answering it honestly is expensive. A reverse index service finds and ranks every matching document, and a document service fetches titles and snippets for each one.',
  });
  tl.tween(cam, CAM_BACK, { at: 36.7, dur: 1.4, ease: ease.move });
  tl.tween(backU, 1, { at: 37.0, dur: 1.2, ease: ease.enter });
  tl.tween(fanU, 1, { at: 38.4, dur: 3.6, ease: ease.linear });
  tl.hold(44.0, 0.5);

  // — Beat 7 · the latency race —
  tl.caption({
    at: 44.5,
    dur: 7.5,
    text: 'Here is the argument for a cache, in microseconds. Reading a megabyte from memory takes about two hundred fifty microseconds. Solid state is four times slower. Disk is eighty times slower.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 44.7, dur: 1.4, ease: ease.move });
  tl.tween(raceU, 1, { at: 45.6, dur: 4.6, ease: ease.linear });
  tl.hold(52.0, 0.5);

  // — Beat 8 · slot the cache in —
  tl.caption({
    at: 52.5,
    dur: 7,
    text: 'Traffic is not evenly distributed. Popular queries repeat all day, so we put a memory cache between the query service and the heavy machinery, and serve repeats straight from memory.',
  });
  tl.tween(raceU, 0.12, { at: 52.7, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_BACK, { at: 52.9, dur: 1.4, ease: ease.move });
  tl.tween(cacheU, 1, { at: 53.6, dur: 1.0, ease: ease.enter });
  tl.tween(hitU, 1, { at: 55.4, dur: 2.4, ease: ease.linear });
  tl.hold(59.5, 0.5);

  // — Beat 9 · the budget —
  tl.caption({
    at: 60.0,
    dur: 7,
    text: 'Each cached entry is tiny: the query, a title, a snippet, about two hundred seventy bytes. But ten billion unique queries would need nearly three terabytes a month, and memory is limited.',
  });
  tl.hold(67.0, 0.5);

  // — Beat 10 · quiet close —
  tl.caption({
    at: 67.5,
    dur: 7,
    text: 'So the real design question is not whether to cache. It is what to keep, what to evict, and when to stop trusting an answer. That is the machine we build next.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 67.7, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 68.1, dur: 1.4, ease: ease.move });
  tl.hold(74.5, 1.5);

  return { tl, cam, rainU, statsU, pipeU, qU, parseK, backU, fanU, raceU, cacheU, hitU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function NodeBox({ x, y, w = 150, h = 60, title, sub, stroke = colors.GRID, opacity = 1 }: {
  x: number; y: number; w?: number; h?: number; title: string; sub?: string; stroke?: string; opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.3} />
      <text x={x} y={y + (sub ? -2 : 5)} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rainU = s.get(scene.rainU);
  const statsU = s.get(scene.statsU);
  const pipeU = s.get(scene.pipeU);
  const qU = s.get(scene.qU);
  const parseK = s.get(scene.parseK);
  const backU = s.get(scene.backU);
  const fanU = s.get(scene.fanU);
  const raceU = s.get(scene.raceU);
  const cacheU = s.get(scene.cacheU);
  const hitU = s.get(scene.hitU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const stage = Math.min(5, Math.floor(parseK + 0.001));
  const qx = qU < 0.5 ? lerp(P.client.x, P.web.x, qU * 2) : lerp(P.web.x, P.api.x, (qU - 0.5) * 2);

  // fan: 0..0.5 out to services, 0.5..1 back with results
  const fanOut = clamp01(fanU * 2);
  const fanBack = clamp01(fanU * 2 - 1);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the rain of queries ---- */}
        <g opacity={dimAll * (1 - pipeU * 0.75)}>
          {DROPS.map((d, i) => {
            const u = clamp01((rainU - d.delay) * d.speed * 2.2);
            if (u <= 0) return null;
            const y = 40 + u * 250;
            return <circle key={i} cx={d.x} cy={y} r={d.r} fill={colors.ACCENT} opacity={0.55 * (1 - u * 0.55)} />;
          })}
          <text x={STAGE_W / 2} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic" opacity={rainU * (1 - statsU * 0.4)}>
            search queries, all day, every day
          </text>
        </g>

        {/* ---- the numbers ---- */}
        <g opacity={statsU * dimAll * (1 - pipeU * 0.6)}>
          {[
            { t: '10 million users', c: colors.TEXT },
            { t: '10 billion queries / month', c: colors.ACCENT },
            { t: '4,000 requests / s', c: colors.WARM },
          ].map((chip, i) => (
            <g key={i}>
              <rect x={340 + i * 210} y={128} width={196} height={34} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={438 + i * 210} y={150} textAnchor="middle" fill={chip.c} fontSize={13}>
                {chip.t}
              </text>
            </g>
          ))}
        </g>

        {/* ---- the pipeline ---- */}
        <g opacity={pipeU * dimAll}>
          <line x1={P.client.x + 60} y1={P.client.y} x2={P.web.x - 75} y2={P.web.y} stroke={colors.GRID} strokeWidth={1.5} />
          <line x1={P.web.x + 75} y1={P.web.y} x2={P.api.x - 75} y2={P.api.y} stroke={colors.GRID} strokeWidth={1.5} />
          <NodeBox x={P.client.x} y={P.client.y} w={110} title="Client" />
          <NodeBox x={P.web.x} y={P.web.y} title="Web Server" sub="reverse proxy" />
          <NodeBox x={P.api.x} y={P.api.y} title="Query API" sub="parse_query · process_query" stroke={colors.ACCENT} />
        </g>
        {qU > 0 && qU < 1 && pipeU > 0.5 && (
          <circle cx={qx} cy={P.client.y} r={7} fill={colors.ACCENT} opacity={dimAll} />
        )}

        {/* ---- parse_query stages ---- */}
        {pipeU > 0.9 && qU >= 1 && (
          <g opacity={dimAll * (1 - backU * 0.15)}>
            <rect x={P.api.x - 210} y={168} width={420} height={78} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={P.api.x} y={192} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
              parse_query · {PARSE_STAGES[stage].label}
            </text>
            <text x={P.api.x} y={222} textAnchor="middle" fill={stage === 5 ? colors.POSITIVE : colors.TEXT} fontSize={16} fontFamily="ui-monospace, monospace">
              {PARSE_STAGES[stage].text}
            </text>
          </g>
        )}

        {/* ---- the backends ---- */}
        <g opacity={backU * dimAll}>
          <line x1={P.api.x + 75} y1={P.api.y - 12} x2={P.idx.x - 95} y2={P.idx.y} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={P.api.x + 75} y1={P.api.y + 12} x2={P.doc.x - 95} y2={P.doc.y} stroke={colors.GRID} strokeWidth={1.4} />
          <NodeBox x={P.idx.x} y={P.idx.y} w={190} title="Reverse Index Service" sub="find + rank matches" stroke={colors.WARM} />
          <NodeBox x={P.doc.x} y={P.doc.y} w={190} title="Document Service" sub="titles + snippets" stroke={colors.WARM} />
        </g>
        {fanOut > 0 && fanOut < 1 && (
          <>
            <Packet from={{ x: P.api.x + 75, y: P.api.y - 12 }} to={{ x: P.idx.x - 95, y: P.idx.y }} u={fanOut} r={6} color={colors.WARM} />
            <Packet from={{ x: P.api.x + 75, y: P.api.y + 12 }} to={{ x: P.doc.x - 95, y: P.doc.y }} u={fanOut} r={6} color={colors.WARM} />
          </>
        )}
        {fanBack > 0 && fanBack < 1 && (
          <>
            <Packet from={{ x: P.idx.x - 95, y: P.idx.y }} to={{ x: P.api.x + 75, y: P.api.y - 12 }} u={fanBack} r={6} color={colors.POSITIVE} />
            <Packet from={{ x: P.doc.x - 95, y: P.doc.y }} to={{ x: P.api.x + 75, y: P.api.y + 12 }} u={fanBack} r={6} color={colors.POSITIVE} />
          </>
        )}

        {/* ---- the latency race ---- */}
        <g opacity={clamp01(raceU * 4) * dimAll * (1 - cacheU * 0.85)}>
          <text x={200} y={112} fill={colors.TEXT} fontSize={15}>
            reading 1 MB, sequentially
          </text>
          {RACE.map((r, i) => {
            const u = clamp01(raceU * (1.3 - i * 0.12));
            const y = 140 + i * 44;
            return (
              <g key={r.name}>
                <text x={190} y={y + 15} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                  {r.name}
                </text>
                <rect x={200} y={y} width={Math.max(2, r.len * u)} height={20} rx={5} fill={r.color} opacity={0.8} />
                {u > 0.97 && (
                  <text x={210 + r.len} y={y + 15} fill={r.color} fontSize={12} fontFamily="ui-monospace, monospace">
                    ~{r.us.toLocaleString('en-US')} µs
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ---- the memory cache slots in ---- */}
        <g opacity={cacheU * dimAll}>
          <rect x={P.cache.x - 70} y={P.cache.y + 78} width={140} height={54} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.8} />
          <text x={P.cache.x} y={P.cache.y + 100} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5}>
            Memory Cache
          </text>
          <text x={P.cache.x} y={P.cache.y + 118} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            Redis or Memcached
          </text>
          <line x1={P.api.x + 40} y1={P.api.y + 30} x2={P.cache.x - 30} y2={P.cache.y + 78} stroke={colors.POSITIVE} strokeWidth={1.3} opacity={0.8} />
        </g>
        {hitU > 0 && hitU < 1 && (
          <Packet
            from={{ x: P.api.x + 40, y: P.api.y + 30 }}
            to={{ x: P.cache.x - 30, y: P.cache.y + 78 }}
            u={hitU < 0.5 ? hitU * 2 : 2 - hitU * 2}
            r={6.5}
            color={colors.POSITIVE}
          />
        )}

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={220} width={700} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={268} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the question the cache must answer
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.ACCENT} fontSize={15}>
            keep what — evict what — trust it for how long
          </text>
          <text x={640} y={370} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="ui-monospace, monospace">
            270 bytes / entry · 10B queries / month · 4,000 req / s
          </text>
          <text x={640} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            memory is fast, and memory is finite
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
