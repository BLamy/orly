// Bottlenecks: where the crawl slows down
//
// Backing files (donnemartin/system-design-primer):
//   solutions/system_design/web_crawler/README.md — "Step 4: Scale the
//   design": 1,600 write requests per second, 40,000 search requests per
//   second; DNS lookup as a crawler bottleneck (keep a refreshed DNS cache);
//   connection pooling (and the UDP note); crawling is bandwidth intensive;
//   Reverse Index Service and Document Service need sharding/federation;
//   Memory Cache for popular queries; latency numbers (memory ~250 µs,
//   SSD 4x, disk 80x).
//
// The machine: the full design assembled — web, crawler loop, stores, index
// services, query path — put under its real load, then four bottlenecks
// glow in turn and each fix visibly widens the pipe. Ends by re-tracing the
// series: frontier, signature, clock, and the answer to a search.
import { CAMERA_HOME, Timeline, colors, ease, mulberry32 } from '../../core';
import { Camera, cameraInterp } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, RequestFlow, ServiceNode, TimerArc, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

interface Pt {
  x: number;
  y: number;
}

/* ---------------------------------------------------------------- */
/* Layout: crawl side left, serve side right.                        */
/* ---------------------------------------------------------------- */

const rand = mulberry32(17);
/** a small patch of web to crawl, left edge */
const WEB: Pt[] = Array.from({ length: 12 }, (_, i) => ({
  x: 92 + (i % 3) * 52 + (rand() - 0.5) * 22,
  y: 226 + Math.floor(i / 3) * 62 + (rand() - 0.5) * 20,
}));
const WEB_EDGE: Pt = { x: 218, y: 330 };

const CRAWLER: Pt = { x: 425, y: 330 };
const NOSQL: Pt = { x: 425, y: 512 };
const RI: Pt = { x: 682, y: 240 };
const DOC: Pt = { x: 682, y: 430 };
const CACHE: Pt = { x: 1010, y: 162 };
const QUERY: Pt = { x: 935, y: 330 };
const WEBSRV: Pt = { x: 1105, y: 330 };
const CLIENT: Pt = { x: 1222, y: 330 };

const GATE: Pt = { x: 306, y: 330 }; // the name-lookup toll on the fetch edge

/** the closing golden run: a page's life, frontier to answered search */
const RECAP_PATH: Pt[] = [
  { x: WEB[7].x, y: WEB[7].y },
  { x: CRAWLER.x, y: CRAWLER.y },
  { x: NOSQL.x, y: NOSQL.y },
  { x: RI.x, y: RI.y },
  { x: QUERY.x, y: QUERY.y },
  { x: WEBSRV.x, y: WEBSRV.y },
  { x: CLIENT.x, y: CLIENT.y },
];

const LAT_BARS = [
  { label: 'memory · 250 µs', rel: 1, color: colors.POSITIVE },
  { label: 'SSD · 4x', rel: 4, color: colors.WARM },
  { label: 'disk · 80x', rel: 80, color: colors.NEGATIVE },
];

const CAM_GATE: CameraState = { x: 330, y: 330, k: 1.62 };
const CAM_SHARDS: CameraState = { x: 682, y: 335, k: 1.4 };
const CAM_CACHE: CameraState = { x: 990, y: 290, k: 1.38 };

/* ---------------------------------------------------------------- */
/* Timeline                                                          */
/* ---------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const zoneU = tl.channel('zoneU', 0);
  const nodesU = tl.channel('nodesU', 0); // all services stagger in (0..8)
  const connU = tl.channel('connU', 0);
  const loadU = tl.channel('loadU', 0); // the req/s labels + traffic starts
  const flowP = tl.channel('flowP', 0); // one linear phase drives all traffic
  const fetchP = tl.channel('fetchP', 0); // fetch cycles through the toll gate
  const b1U = tl.channel('b1U', 0); // dns toll spotlight
  const fix1U = tl.channel('fix1U', 0); // dns cache — traffic speeds up
  const b2U = tl.channel('b2U', 0); // handshake churn spotlight
  const fix2U = tl.channel('fix2U', 0); // connection pool — lines stay open
  const blinkP = tl.channel('blinkP', 0); // open/close churn phase
  const b3U = tl.channel('b3U', 0); // index overload spotlight
  const fix3U = tl.channel('fix3U', 0); // shard + federate
  const b4U = tl.channel('b4U', 0); // cache spotlight
  const cacheP = tl.channel('cacheP', 0); // popular query round trip
  const latBarsU = tl.channel('latBarsU', 0); // the latency ladder
  const recapDim = tl.channel('recapDim', 0); // quiet the stage for the close
  const recapP = tl.channel('recapP', 0); // the golden run

  // ---- beat 1: the whole design, assembled -------------------------------
  tl.caption({
    at: 0.3,
    dur: 5.4,
    text: 'Put the whole design on the table: the crawl loop on the left, and the search path it feeds on the right.',
  });
  tl.tween(zoneU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(nodesU, 8, { at: 0.9, dur: 2.2, ease: ease.enter });
  tl.tween(connU, 1, { at: 2.6, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 6.3,
    dur: 6.4,
    text: 'Now load it. Sixteen hundred pages written every second. Forty thousand searches answered every second. Something has to creak first.',
  });
  tl.tween(loadU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.tween(flowP, 26, { at: 7.0, dur: 66, ease: ease.linear });
  tl.tween(fetchP, 22, { at: 7.0, dur: 66, ease: ease.linear });
  tl.tween(blinkP, 30, { at: 7.0, dur: 66, ease: ease.linear });
  tl.hold(12.9, 0.4);

  // ---- beat 2: bottleneck 1 — name lookups --------------------------------
  tl.tween(cam, CAM_GATE, { at: 13.3, dur: 1.4, ease: ease.move });
  tl.tween(b1U, 1, { at: 13.9, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 13.6,
    dur: 8.0,
    text: 'First toll: name lookups. Every fetch starts by resolving a domain, and that round trip adds up at crawler scale — so the crawl service keeps its own lookup cache and refreshes it on a schedule.',
  });
  tl.tween(fix1U, 1, { at: 19.4, dur: 1.2, ease: ease.move });
  tl.hold(22.0, 0.4);

  // ---- beat 3: bottleneck 2 — connections ----------------------------------
  tl.tween(b1U, 0, { at: 22.4, dur: 0.6, ease: ease.enter });
  tl.tween(b2U, 1, { at: 22.8, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 22.6,
    dur: 7.6,
    text: 'Second: connections. Opening a fresh one per page is pure overhead, so the crawler keeps a pool of connections open and reuses them. Crawling is bandwidth hungry — the pipe itself is a budget.',
  });
  tl.tween(fix2U, 1, { at: 27.4, dur: 1.2, ease: ease.move });
  tl.hold(30.6, 0.4);

  // ---- beat 4: bottleneck 3 — the readers -----------------------------------
  tl.tween(b2U, 0, { at: 31.0, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_SHARDS, { at: 31.2, dur: 1.4, ease: ease.move });
  tl.tween(b3U, 1, { at: 31.9, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 31.6,
    dur: 7.2,
    text: 'Third: the readers. Forty thousand searches a second flatten a single index server, so the reverse index and the document store shard their data across many machines.',
  });
  tl.tween(fix3U, 1, { at: 36.4, dur: 1.2, ease: ease.move });
  tl.hold(39.2, 0.4);

  // ---- beat 5: bottleneck 4 — repetition, and the latency ladder -------------
  tl.tween(b3U, 0, { at: 39.6, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAM_CACHE, { at: 39.8, dur: 1.4, ease: ease.move });
  tl.tween(b4U, 1, { at: 40.5, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 40.2,
    dur: 6.2,
    text: 'Fourth: repetition. A handful of queries are wildly popular, so a memory cache answers them before they ever touch the index.',
  });
  tl.tween(cacheP, 1, { at: 41.4, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 47.0,
    dur: 7.0,
    text: 'Memory answers in a quarter of a millisecond. Solid state is four times slower, and spinning disk eighty times — where data lives is a latency decision.',
  });
  tl.tween(latBarsU, 1, { at: 48.0, dur: 1.6, ease: ease.draw });
  tl.hold(54.4, 0.5);

  // ---- beat 6: the recap — a page's whole life --------------------------------
  tl.tween(b4U, 0, { at: 54.9, dur: 0.6, ease: ease.enter });
  tl.tween(latBarsU, 0, { at: 54.9, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 55.1, dur: 1.5, ease: ease.move });
  tl.tween(recapDim, 1, { at: 55.4, dur: 1.0, ease: ease.move });
  tl.caption({
    at: 56.2,
    dur: 5.6,
    text: "And that's the crawler, solved. A ranked frontier feeds one loop that pops, fetches, and files.",
  });
  tl.tween(recapP, 1, { at: 57.0, dur: 12.0, ease: ease.linear });
  tl.caption({
    at: 62.4,
    dur: 5.8,
    text: 'Signatures keep that loop out of cycles, and every page re-crawls on its own measured clock.',
  });
  tl.caption({
    at: 68.8,
    dur: 6.6,
    text: "And when it groans under load, you know where to look: lookups, connections, shards, and caches. That's the design — see you at the next whiteboard.",
  });
  tl.hold(75.4, 1.2);

  return {
    tl,
    cam,
    zoneU,
    nodesU,
    connU,
    loadU,
    flowP,
    fetchP,
    b1U,
    fix1U,
    b2U,
    fix2U,
    blinkP,
    b3U,
    fix3U,
    b4U,
    cacheP,
    latBarsU,
    recapDim,
    recapP,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- */
/* Render                                                            */
/* ---------------------------------------------------------------- */

function Chip({ x, y, text, u, color = colors.ACCENT, mono = false }: { x: number; y: number; text: string; u: number; color?: string; mono?: boolean }) {
  if (u <= 0.002) return null;
  const w = text.length * (mono ? 7.4 : 6.6) + 22;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={6} fill={colors.PANEL} stroke={color} strokeOpacity={0.6} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={color} fontSize={12} fontFamily={mono ? 'ui-monospace, monospace' : undefined}>
        {text}
      </text>
    </g>
  );
}

function renderFrame(s: SceneState) {
  const zoneU = s.get(scene.zoneU);
  const nodesU = s.get(scene.nodesU);
  const connU = s.get(scene.connU);
  const loadU = s.get(scene.loadU);
  const flowP = s.get(scene.flowP);
  const fetchP = s.get(scene.fetchP);
  const b1U = s.get(scene.b1U);
  const fix1U = s.get(scene.fix1U);
  const b2U = s.get(scene.b2U);
  const fix2U = s.get(scene.fix2U);
  const blinkP = s.get(scene.blinkP);
  const b3U = s.get(scene.b3U);
  const fix3U = s.get(scene.fix3U);
  const b4U = s.get(scene.b4U);
  const cacheP = s.get(scene.cacheP);
  const latBarsU = s.get(scene.latBarsU);
  const recapDim = s.get(scene.recapDim);
  const recapP = s.get(scene.recapP);

  const dim = recapDim * 0.55;
  // fetch traffic speeds up once the lookup cache lands
  const fetchFlow = fetchP * lerp(1, 2.6, fix1U);
  const gateSpin = (fetchP * lerp(1, 3, fix1U)) % 1;
  // pre-fix the connections churn open/closed; post-fix they hold steady
  const churn = 0.35 + 0.65 * Math.abs(Math.sin(blinkP * Math.PI));

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ---------- zones ---------- */}
      <Zone x={60} y={120} w={640} h={470} label="the crawl loop" kind="group" u={zoneU} dim={dim} />
      <Zone x={740} y={120} w={520} h={470} label="the search path" kind="group" u={zoneU} dim={dim} />

      {/* ---------- the patch of web ---------- */}
      <g opacity={(1 - dim) * clamp01(nodesU)}>
        {WEB.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.MUTED} opacity={0.75} />
        ))}
        <text x={92} y={196} fill={colors.MUTED} fontSize={12.5}>
          the web
        </text>
      </g>

      {/* ---------- edges ---------- */}
      <Connection from={WEB_EDGE} to={{ x: CRAWLER.x - 88, y: CRAWLER.y }} u={connU} flow={fetchFlow} color={colors.ACCENT} width={lerp(1.6, 3.2, fix2U)} arrow dim={dim} label={loadU > 0.5 ? '1,600 writes / s' : undefined} labelSize={11} />
      <Connection from={{ x: CRAWLER.x, y: CRAWLER.y + 32 }} to={{ x: NOSQL.x, y: NOSQL.y - 32 }} u={connU} flow={flowP} color={colors.MUTED} width={1.6} arrow dim={dim} />
      <Connection from={{ x: CRAWLER.x + 88, y: CRAWLER.y - 12 }} to={{ x: RI.x - 92, y: RI.y }} u={connU} flow={flowP} color={colors.MUTED} width={1.6} arrow dim={dim} />
      <Connection from={{ x: CRAWLER.x + 88, y: CRAWLER.y + 12 }} to={{ x: DOC.x - 92, y: DOC.y }} u={connU} flow={flowP} color={colors.MUTED} width={1.6} arrow dim={dim} />
      <Connection from={{ x: QUERY.x - 74, y: QUERY.y - 10 }} to={{ x: RI.x + 92, y: RI.y }} u={connU} flow={flowP * 1.6} color={colors.SECONDARY} width={2.2} arrow dim={dim} />
      <Connection from={{ x: QUERY.x - 74, y: QUERY.y + 10 }} to={{ x: DOC.x + 92, y: DOC.y }} u={connU} flow={flowP * 1.6} color={colors.SECONDARY} width={2.2} arrow dim={dim} />
      <Connection from={{ x: QUERY.x, y: QUERY.y - 32 }} to={{ x: CACHE.x, y: CACHE.y + 30 }} u={connU} flow={flowP * 1.6} color={colors.SECONDARY} width={1.8} arrow dim={dim} />
      <Connection from={{ x: WEBSRV.x - 62, y: WEBSRV.y }} to={{ x: QUERY.x + 74, y: QUERY.y }} u={connU} flow={flowP * 1.6} color={colors.SECONDARY} width={2.2} arrow dim={dim} label={loadU > 0.5 ? '40,000 searches / s' : undefined} labelSize={11} />
      <Connection from={{ x: CLIENT.x - 40, y: CLIENT.y }} to={{ x: WEBSRV.x + 62, y: WEBSRV.y }} u={connU} flow={flowP * 1.6} color={colors.SECONDARY} width={1.8} arrow dim={dim} />

      {/* the connection pool: three kept-open lines during beat 3 */}
      {b2U > 0.002 && (
        <g opacity={b2U}>
          {[-14, 0, 14].map((dy, i) => (
            <line
              key={i}
              x1={WEB_EDGE.x + 6}
              y1={330 + dy}
              x2={CRAWLER.x - 92}
              y2={330 + dy}
              stroke={fix2U > 0.5 ? colors.POSITIVE : colors.WARM}
              strokeWidth={2}
              strokeDasharray={fix2U > 0.5 ? undefined : '6 8'}
              opacity={fix2U > 0.5 ? 0.9 : churn}
            />
          ))}
        </g>
      )}

      {/* ---------- services ---------- */}
      <ServiceNode x={CRAWLER.x} y={CRAWLER.y} kind="server" label="Crawler Service" sublabel="crawl() loop" w={176} u={clamp01(nodesU)} dim={dim} replicas={4} glow={Math.max(b1U, b2U) * 0.5} />
      <ServiceNode x={NOSQL.x} y={NOSQL.y} kind="db" label="NoSQL store" sublabel="links_to_crawl · crawled_links" w={216} u={clamp01(nodesU - 1)} dim={dim} />
      <ServiceNode x={RI.x} y={RI.y} kind="search" label="Reverse Index Service" w={184} u={clamp01(nodesU - 2)} dim={dim} status={b3U > 0.3 && fix3U < 0.5 ? 'warn' : 'ok'} glow={b3U * 0.6} replicas={fix3U > 0.5 ? 4 : undefined} />
      <ServiceNode x={DOC.x} y={DOC.y} kind="storage" label="Document Service" sublabel="titles + snippets" w={184} u={clamp01(nodesU - 3)} dim={dim} status={b3U > 0.3 && fix3U < 0.5 ? 'warn' : 'ok'} replicas={fix3U > 0.5 ? 4 : undefined} />
      <ServiceNode x={CACHE.x} y={CACHE.y} kind="cache" label="Memory Cache" sublabel="popular queries" w={170} u={clamp01(nodesU - 4)} dim={dim} glow={b4U * 0.7} />
      <ServiceNode x={QUERY.x} y={QUERY.y} kind="server" label="Query API" w={150} u={clamp01(nodesU - 5)} dim={dim} />
      <ServiceNode x={WEBSRV.x} y={WEBSRV.y} kind="lb" label="Web Server" sublabel="reverse proxy" w={128} u={clamp01(nodesU - 6)} dim={dim} />
      <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="Client" w={86} u={clamp01(nodesU - 7)} dim={dim} />

      {/* ---------- beat 2: the name-lookup toll ---------- */}
      {b1U > 0.002 && (
        <g opacity={b1U}>
          <rect x={GATE.x - 16} y={GATE.y - 26} width={32} height={52} rx={7} fill={colors.PANEL} stroke={fix1U > 0.5 ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1.6} />
          <TimerArc cx={GATE.x} cy={GATE.y} r={10} u={1 - gateSpin} color={fix1U > 0.5 ? colors.POSITIVE : colors.NEGATIVE} />
          <Chip x={GATE.x} y={GATE.y - 46} text={fix1U > 0.5 ? 'own DNS cache — refreshed' : 'name lookup, every fetch'} u={1} color={fix1U > 0.5 ? colors.POSITIVE : colors.NEGATIVE} />
        </g>
      )}
      <Chip x={CRAWLER.x} y={CRAWLER.y + 58} text="connection pool — keep them open (UDP helps too)" u={b2U * fix2U} color={colors.POSITIVE} />
      <Chip x={682} y={335} text="shard + federate" u={b3U * fix3U} color={colors.POSITIVE} />

      {/* ---------- beat 5: a popular query short-circuits ---------- */}
      {cacheP > 0.001 && cacheP < 0.999 && (
        <RequestFlow
          path={[CLIENT, WEBSRV, QUERY, CACHE]}
          u={cacheP}
          roundTrip
          color={colors.WARM}
          responseColor={colors.POSITIVE}
          r={7}
          label="popular query"
          responseLabel="cached answer"
          labelSize={11}
        />
      )}
      {latBarsU > 0.002 && (
        <g opacity={latBarsU}>
          <rect x={860} y={430} width={356} height={158} rx={12} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={884} y={460} fill={colors.TEXT} fontSize={13.5}>
            read 1 MB sequentially:
          </text>
          {LAT_BARS.map((b, i) => {
            const w = 24 * Math.sqrt(b.rel);
            return (
              <g key={b.label}>
                <rect x={884} y={476 + i * 34} width={w * clamp01(latBarsU * 3 - i)} height={14} rx={5} fill={b.color} opacity={0.85} />
                <text x={884 + w + 10} y={488 + i * 34} fill={colors.MUTED} fontSize={12}>
                  {b.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* ---------- the recap run ---------- */}
      {recapP > 0.001 && recapP < 0.999 && (
        <RequestFlow path={RECAP_PATH} u={recapP} color={colors.WARM} r={9} label="one page's life" dwell={0.22} labelSize={12} />
      )}
    </Camera>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
