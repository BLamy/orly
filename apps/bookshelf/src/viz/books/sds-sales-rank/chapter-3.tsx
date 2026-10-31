// Serving the Leaderboard: the read path and the scale-out
//
// Backed by: solutions/system_design/sales_rank/README.md — the sales_rank
// table schema (id, category_id, total_sold, product_id, with indexes on id,
// category_id, product_id for log-time lookups kept in memory); the read use
// case (Client → Web Server reverse proxy → Read API server → sales_rank
// table) with the public REST API GET /api/v1/popular?category_id=1234 and
// its sample response (total_sold 100000 / 90000 / 80000); and Step 4 scaling
// (40,000 average reads/s served by a Memory Cache in front of SQL read
// replicas; analytics in a data warehouse like Amazon Redshift or Google
// BigQuery; older data offloaded to the Object Store; 400 writes/s straining
// a single SQL write master-slave).
//
// ONE machine: the sales_rank table fills from the MapReduce output, one
// request walks the read path and carries the real JSON home, then a rain of
// reads slams the stack and the memory cache absorbs it.
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

// the sales_rank rows (the README's REST response for category 1234)
const ROWS = [
  { id: '100', product: '50', sold: '100,000' },
  { id: '53', product: '200', sold: '90,000' },
  { id: '75', product: '3', sold: '80,000' },
] as const;

const TBL = { x: 800, y0: 150, w: 380, rowH: 44 } as const;
// column x offsets inside the table: wide enough that category_id and total_sold never touch
const COL_X = [14, 106, 198, 290] as const;
const PATH = {
  client: { x: 170, y: 400 },
  web: { x: 390, y: 400 },
  api: { x: 610, y: 400 },
  db: { x: 830, y: 400 },
} as const;
const CACHE = { x: 790, y: 540 } as const;
const RETURN_Y = 452; // the answer rides home in its own lane under the boxes
// the first hop of the request, where the read flood lands: client's right edge → web server's left edge
const HOP = { x0: PATH.client.x + 55, x1: PATH.web.x - 80, y: PATH.client.y } as const;

const rand = mulberry32(20260718);
const N_READS = 30;
const READS = Array.from({ length: N_READS }, (_, i) => ({
  y: 150 + rand() * 380,
  delay: (i / N_READS) * 0.85,
  toCache: i % 5 !== 0, // most reads absorbed by the cache
}));

const CAM_TBL: CameraState = { x: 980, y: 290, k: 1.3 };
const CAM_PATH: CameraState = { x: 600, y: 380, k: 1.0 };
const CAM_SCALE: CameraState = { x: 660, y: 420, k: 1.05 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  tblU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  pathU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  jsonU: ChannelRef<number>;
  cacheU: ChannelRef<number>;
  rainU: ChannelRef<number>;
  replU: ChannelRef<number>;
  whU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tblU = tl.channel('tblU', 0); // schema + table frame
  const fillU = tl.channel('fillU', 0); // mapreduce rows land
  const pathU = tl.channel('pathU', 0); // client→web→api→db
  const reqU = tl.channel('reqU', 0); // request round trip
  const jsonU = tl.channel('jsonU', 0); // response json panel
  const cacheU = tl.channel('cacheU', 0); // memory cache appears
  const rainU = tl.channel('rainU', 0); // 40k reads/s rain
  const replU = tl.channel('replU', 0); // read replicas
  const whU = tl.channel('whU', 0); // warehouse + object store
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the table —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'The map reduce job needs somewhere to put its answer. It writes into a small relational table called sales rank: a category, a product, and how many were sold.',
  });
  tl.tween(cam, CAM_TBL, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(tblU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(fillU, 1, { at: 2.6, dur: 2.6, ease: ease.linear });
  tl.hold(7.0, 0.5);

  // — Beat 2 · indexes —
  tl.caption({
    at: 7.5,
    dur: 6.5,
    text: 'Indexes on the category and product columns keep lookups logarithmic and the working set in memory, where reading a megabyte costs about two hundred fifty microseconds.',
  });
  tl.hold(14.0, 0.5);

  // — Beat 3 · the read path —
  tl.caption({
    at: 14.5,
    dur: 6.5,
    text: 'Now the read path. A shopper opens the popular products page. The request hits a web server acting as a reverse proxy, which forwards it to the read A P I service.',
  });
  tl.tween(cam, CAM_PATH, { at: 14.7, dur: 1.5, ease: ease.move });
  tl.tween(pathU, 1, { at: 14.9, dur: 1.8, ease: ease.draw });
  tl.tween(reqU, 0.5, { at: 16.8, dur: 2.0, ease: ease.linear });
  tl.hold(21.0, 0.5);

  // — Beat 4 · the answer —
  tl.caption({
    at: 21.5,
    dur: 7,
    text: 'The read service asks the table for category twelve thirty four and gets back the top sellers in order: one hundred thousand sold, ninety thousand, eighty thousand. That list rides home as a plain text response.',
  });
  tl.tween(reqU, 1, { at: 22.4, dur: 2.4, ease: ease.linear });
  tl.tween(jsonU, 1, { at: 25.2, dur: 1.0, ease: ease.enter });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the read flood —
  tl.caption({
    at: 29.0,
    dur: 6.5,
    text: 'Here is the catch: this system reads a hundred times more than it writes. Forty thousand read requests a second, on average, and worse at peak. No single database enjoys that.',
  });
  tl.tween(cam, CAM_SCALE, { at: 29.2, dur: 1.5, ease: ease.move });
  tl.tween(rainU, 1, { at: 30.2, dur: 4.4, ease: ease.linear });
  tl.hold(35.5, 0.5);

  // — Beat 6 · the cache absorbs —
  tl.caption({
    at: 36.0,
    dur: 7,
    text: 'So popular categories are served from a memory cache instead of the database. The hot leaderboards live in memory, and the cache also soaks up the spikes when traffic gets uneven.',
  });
  tl.tween(cacheU, 1, { at: 36.6, dur: 1.0, ease: ease.enter });
  tl.hold(42.5, 0.5);

  // — Beat 7 · replicas + warehouse —
  tl.caption({
    at: 43.0,
    dur: 7.5,
    text: 'Behind the cache, read replicas share the misses. Analytics moves to a data warehouse, and receipts past their useful life retire to the object store, so the database only keeps what it serves.',
  });
  tl.tween(replU, 1, { at: 43.6, dur: 1.2, ease: ease.enter });
  tl.tween(whU, 1, { at: 46.4, dur: 1.2, ease: ease.enter });
  tl.hold(50.5, 0.5);

  // — Beat 8 · recap —
  tl.caption({
    at: 51.0,
    dur: 8,
    text: 'Trace the whole journey once more. A receipt is logged, lands in the object store, is mapped, summed, and sorted into a leaderboard, and an hour later a shopper reads it back in one indexed lookup. That is sales rank.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 51.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.8, dur: 1.4, ease: ease.move });
  tl.hold(59.0, 1.5);

  return { tl, cam, tblU, fillU, pathU, reqU, jsonU, cacheU, rainU, replU, whU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Box({ x, y, w = 160, h = 60, title, sub, stroke = colors.GRID, opacity = 1 }: {
  x: number; y: number; w?: number; h?: number; title: string; sub?: string; stroke?: string; opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.3} />
      <text x={x} y={y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tblU = s.get(scene.tblU);
  const fillU = s.get(scene.fillU);
  const pathU = s.get(scene.pathU);
  const reqU = s.get(scene.reqU);
  const jsonU = s.get(scene.jsonU);
  const cacheU = s.get(scene.cacheU);
  const rainU = s.get(scene.rainU);
  const replU = s.get(scene.replU);
  const whU = s.get(scene.whU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.92;
  // request: 0..0.25 client→web, 0.25..0.5 web→api, 0.5..0.75 api→db, 0.75..1 db→client (the answer)
  const segs = [
    { a: PATH.client, b: PATH.web },
    { a: PATH.web, b: PATH.api },
    { a: PATH.api, b: PATH.db },
  ] as const;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the sales_rank table ---- */}
        <g opacity={tblU * dimAll}>
          <text x={TBL.x} y={TBL.y0 - 40} fill={colors.TEXT} fontSize={16}>
            the leaderboard table
          </text>
          <text x={TBL.x} y={TBL.y0 - 18} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
            sales_rank(id, category_id, total_sold, product_id)
          </text>
          <rect x={TBL.x} y={TBL.y0} width={TBL.w} height={30} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          {/* the indexed columns (id, category_id, product_id) are highlighted: that is what the caption says is indexed */}
          {['id', 'category_id', 'total_sold', 'product_id'].map((h, i) => (
            <text key={h} x={TBL.x + COL_X[i]} y={TBL.y0 + 20} fill={h === 'total_sold' ? colors.TEXT : colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace">
              {h}
            </text>
          ))}
          {ROWS.map((r, i) => {
            const u = clamp01(fillU * 2.4 - i * 0.55);
            if (u <= 0) return null;
            const y = TBL.y0 + 36 + i * TBL.rowH;
            return (
              <g key={i} opacity={u}>
                <rect x={TBL.x + (1 - u) * -50} y={y} width={TBL.w} height={TBL.rowH - 8} rx={7} fill={colors.PANEL} stroke={i === 0 ? colors.POSITIVE : colors.GRID} strokeWidth={i === 0 ? 1.5 : 1} />
                {[r.id, '1234', r.sold, r.product].map((v, j) => (
                  <text key={j} x={TBL.x + COL_X[j]} y={y + 24} fill={j === 2 ? colors.POSITIVE : colors.TEXT} fontSize={13} fontFamily="ui-monospace, monospace">
                    {v}
                  </text>
                ))}
              </g>
            );
          })}
          <text x={TBL.x} y={TBL.y0 + 36 + 3 * TBL.rowH + 14} fill={colors.ACCENT} fontSize={12} fontFamily="ui-monospace, monospace" opacity={fillU}>
            INDEX(id, category_id, product_id) · hourly rewrite
          </text>
        </g>

        {/* ---- the read path ---- */}
        <g opacity={pathU * dimAll}>
          {segs.map((sg, i) => (
            <line key={i} x1={sg.a.x + 80} y1={sg.a.y} x2={sg.b.x - 80} y2={sg.b.y} stroke={colors.GRID} strokeWidth={1.5} />
          ))}
          <line x1={PATH.db.x - 80} y1={RETURN_Y} x2={PATH.client.x + 55} y2={RETURN_Y} stroke={colors.GRID} strokeWidth={1} strokeDasharray="4 5" opacity={0.6} />

          <Box x={PATH.client.x} y={PATH.client.y} w={110} title="Client" />
          <Box x={PATH.web.x} y={PATH.web.y} title="Web Server" sub="reverse proxy" />
          <Box x={PATH.api.x} y={PATH.api.y} title="Read API" sub="GET /api/v1/popular" stroke={colors.ACCENT} />
          <Box x={PATH.db.x} y={PATH.db.y} title="SQL Database" sub="sales_rank" stroke={colors.POSITIVE} />
        </g>
        {reqU > 0 && reqU < 1 && (() => {
          if (reqU < 0.75) {
            const k = Math.min(2, Math.floor(reqU / 0.25));
            const u = (reqU - k * 0.25) / 0.25;
            const sg = segs[k];
            return <Packet from={{ x: sg.a.x + 80, y: sg.a.y }} to={{ x: sg.b.x - 80, y: sg.b.y }} u={u} r={7} color={colors.ACCENT} />;
          }
          const u = (reqU - 0.75) / 0.25;
          return <Packet from={{ x: PATH.db.x - 80, y: RETURN_Y }} to={{ x: PATH.client.x + 55, y: RETURN_Y }} u={u} r={7} color={colors.POSITIVE} />;
        })()}

        {/* ---- the JSON answer ---- */}
        <g opacity={jsonU * dimAll * (1 - rainU * 0.75)}>
          <rect x={100} y={480} width={320} height={140} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
          <text x={118} y={504} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            GET /api/v1/popular?category_id=1234
          </text>
          {/* JSON numbers carry no thousands separators */}
          {ROWS.map((r, i) => (
            <text key={i} x={118} y={530 + i * 22} fill={colors.TEXT} fontSize={12} fontFamily="ui-monospace, monospace">
              {`{ product_id: ${r.product}, total_sold: ${r.sold.replace(',', '')} }`}
            </text>
          ))}
          <text x={118} y={600} fill={colors.POSITIVE} fontSize={12} fontFamily="ui-monospace, monospace">
            200 OK · REST
          </text>
        </g>

        {/* ---- the read flood ---- */}
        {/* the reads ride the request's first hop only; each dot finishes inside the rain, so none get stuck mid-flight */}
        <g opacity={dimAll}>
          {READS.map((r, i) => {
            const p = clamp01((rainU - r.delay * 0.7) / 0.3);
            if (p <= 0 || p >= 1) return null;
            const cx = HOP.x0 + p * (HOP.x1 - HOP.x0);
            const cy = HOP.y + ((r.y - 150) / 380 - 0.5) * 22;
            return <circle key={i} cx={cx} cy={cy} r={4} fill={r.toCache ? colors.WARM : colors.MUTED} opacity={0.9} />;
          })}
          {rainU > 0.1 && rainU < 1 && (
            <text x={268} y={350} textAnchor="middle" fill={colors.WARM} fontSize={14} opacity={dimAll}>
              40,000 reads / s
            </text>
          )}
        </g>

        {/* ---- memory cache + replicas + warehouse ---- */}
        <g opacity={cacheU * dimAll}>
          <line x1={PATH.api.x + 40} y1={PATH.api.y + 30} x2={CACHE.x - 60} y2={CACHE.y - 30} stroke={colors.WARM} strokeWidth={1.5} />
          <line x1={CACHE.x + 40} y1={CACHE.y - 30} x2={PATH.db.x} y2={PATH.db.y + 30} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="4 5" />
          <Box x={CACHE.x} y={CACHE.y} w={180} title="Memory Cache" sub="hot categories" stroke={colors.WARM} />
        </g>
        <g opacity={replU * dimAll}>
          <Box x={1060} y={480} w={150} h={48} title="Read Replica" stroke={colors.GRID} />
          <Box x={1060} y={550} w={150} h={48} title="Read Replica" stroke={colors.GRID} />
          <line x1={PATH.db.x + 50} y1={PATH.db.y + 30} x2={985} y2={480} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
          <line x1={PATH.db.x + 50} y1={PATH.db.y + 30} x2={985} y2={550} stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
        </g>
        <g opacity={whU * dimAll}>
          <Box x={540} y={500} w={190} h={50} title="Analytics Warehouse" sub="Redshift / BigQuery" stroke={colors.SECONDARY} />
          <Box x={540} y={572} w={190} h={44} title="Object Store" sub="old receipts retire here" stroke={colors.GRID} />
        </g>

      </Camera>

      {/* ---- closing panel: screen space, over a solid backdrop so no faded diagram shows through ---- */}
      <g opacity={closeU}>
        <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} opacity={0.94} />
        <rect x={265} y={195} width={750} height={280} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
        <text x={640} y={244} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
          sales rank, end to end
        </text>
        {[
          ['log', 'every sale writes one line from the Sales API'],
          ['store', 'raw logs land in the object store'],
          ['rank', 'the two-step MapReduce sums and sorts, hourly'],
          ['serve', 'one indexed lookup, cached for the hot categories'],
        ].map(([k, v], i) => (
          <g key={k}>
            <text x={430} y={292 + i * 40} textAnchor="end" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
              {k}
            </text>
            <text x={458} y={292 + i * 40} fill={colors.TEXT} fontSize={14}>
              {v}
            </text>
          </g>
        ))}
        <text x={640} y={448} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
          a billion receipts a month, one calm leaderboard
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
