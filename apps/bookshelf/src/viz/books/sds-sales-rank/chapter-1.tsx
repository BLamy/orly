// A River of Receipts: the ingestion problem
//
// Backed by: solutions/system_design/sales_rank/README.md — Step 1 constraints
// (10 million products, 1,000 categories, 1 billion transactions/month, ~40
// bytes per transaction → 40 GB of new content a month, 1.44 TB in 3 years,
// 400 average transactions/s, 40,000 average reads/s, 100:1 read to write,
// results updated hourly) and Step 3 (raw Sales API server log files stored on
// a managed Object Store such as Amazon S3; the tab-delimited log format:
// timestamp, product_id, category_id, qty, total_price, seller_id, buyer_id).
//
// ONE machine: a river of tab-delimited receipt lines pouring out of the Sales
// API into the object store. We read one line's anatomy, stamp the envelope
// numbers, frame the actual question (top sellers per category, past week,
// refreshed hourly), and end on why one box can't just sort the river.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The receipts — the README's real sample rows, cycled with seeded variety.
// ---------------------------------------------------------------------------

const SAMPLE = [
  't1  product1  category1  2  20.00  1  1',
  't2  product1  category2  2  20.00  2  2',
  't2  product1  category2  1  10.00  2  3',
  't3  product2  category1  3   7.00  3  4',
  't4  product3  category2  7   2.00  4  5',
  't5  product4  category1  1   5.00  5  6',
] as const;

const COLS = ['timestamp', 'product_id', 'category_id', 'qty', 'total_price', 'seller_id', 'buyer_id'] as const;

const rand = mulberry32(20260717);
const N_LINES = 26;
const LINES = Array.from({ length: N_LINES }, (_, i) => ({
  text: SAMPLE[i % SAMPLE.length],
  delay: (i / N_LINES) * 0.9,
  x: 150 + rand() * 60,
}));

// the anatomy panel row (the first sample row, split into fields)
const ANAT = ['t1', 'product1', 'category1', '2', '20.00', '1', '1'] as const;

const STATS = [
  { t: '1 billion transactions / month', c: colors.ACCENT },
  { t: '~40 bytes each · 40 GB / month', c: colors.TEXT },
  { t: '400 writes / s · 40,000 reads / s', c: colors.WARM },
] as const;

const API = { x: 250, y: 190 } as const;
const STORE = { x: 250, y: 500 } as const;

const CAM_TAPE: CameraState = { x: 480, y: 350, k: 1.15 };
const CAM_ANAT: CameraState = { x: 800, y: 300, k: 1.28 };
const CAM_MOUNT: CameraState = { x: 860, y: 400, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rigU: ChannelRef<number>;
  flowU: ChannelRef<number>;
  anatU: ChannelRef<number>;
  colK: ChannelRef<number>;
  statsU: ChannelRef<number>;
  askU: ChannelRef<number>;
  weekU: ChannelRef<number>;
  mountU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rigU = tl.channel('rigU', 0); // sales api + object store
  const flowU = tl.channel('flowU', 0); // receipts streaming down
  const anatU = tl.channel('anatU', 0); // one line dissected
  const colK = tl.channel('colK', -1); // highlighted field index
  const statsU = tl.channel('statsU', 0);
  const askU = tl.channel('askU', 0); // the question panel
  const weekU = tl.channel('weekU', 0); // the past-week window
  const mountU = tl.channel('mountU', 0); // the mountain of rows
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the river —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'You are asked to design the sales rank feature for a giant store: the most popular products in every category, from the past week. The raw material is receipts, a billion of them a month.',
  });
  tl.tween(rigU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(flowU, 1, { at: 1.6, dur: 4.0, ease: ease.linear });
  tl.hold(7.5, 0.5);

  // — Beat 2 · where they land —
  tl.caption({
    at: 8.0,
    dur: 6.5,
    text: 'Every sale writes one log line from the sales service. Rather than run our own distributed file system, the raw log files land in a managed object store.',
  });
  tl.tween(cam, CAM_TAPE, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.hold(14.5, 0.5);

  // — Beat 3 · the anatomy —
  tl.caption({
    at: 15.0,
    dur: 6.5,
    text: 'Look at one receipt. Seven tab separated fields: a timestamp, the product, its category, the quantity, the price, the seller, and the buyer.',
  });
  tl.tween(cam, CAM_ANAT, { at: 15.2, dur: 1.4, ease: ease.move });
  tl.tween(anatU, 1, { at: 15.6, dur: 1.2, ease: ease.enter });
  tl.tween(colK, 6, { at: 16.6, dur: 4.2, ease: ease.linear });
  tl.hold(21.5, 0.5);

  // — Beat 4 · three fields matter —
  tl.caption({
    at: 22.0,
    dur: 6,
    text: 'For sales rank, only three of them matter: when it happened, what was sold, and which category it counts toward. Keep those three in mind.',
  });
  tl.set(colK, 0, 23.0);
  tl.set(colK, 1, 24.2);
  tl.set(colK, 2, 25.4);
  tl.hold(28.0, 0.5);

  // — Beat 5 · the envelope —
  tl.caption({
    at: 28.5,
    dur: 7,
    text: 'The envelope math sets the stakes. A billion transactions a month at roughly forty bytes each is forty gigabytes of new receipts, four hundred writes a second, and one hundred times as many reads.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 28.7, dur: 1.4, ease: ease.move });
  tl.tween(statsU, 1, { at: 29.4, dur: 0.9, ease: ease.pop });
  tl.hold(35.5, 0.5);

  // — Beat 6 · the question —
  tl.caption({
    at: 36.0,
    dur: 7,
    text: 'And here is the exact question the service must keep answering: for each of a thousand categories, which of ten million products sold the most in the past week, refreshed every hour.',
  });
  tl.tween(askU, 1, { at: 36.6, dur: 1.0, ease: ease.enter });
  tl.tween(weekU, 1, { at: 39.0, dur: 1.6, ease: ease.move });
  tl.hold(43.0, 0.5);

  // — Beat 7 · the mountain —
  tl.caption({
    at: 43.5,
    dur: 7,
    text: 'The naive plan, load everything into one machine and sort it, dies on contact. The receipts of a single week are a mountain, and the mountain grows while you climb it.',
  });
  tl.tween(cam, CAM_MOUNT, { at: 43.7, dur: 1.5, ease: ease.move });
  tl.tween(mountU, 1, { at: 44.2, dur: 2.4, ease: ease.draw });
  tl.hold(50.5, 0.5);

  // — Beat 8 · the promise —
  tl.caption({
    at: 51.0,
    dur: 7,
    text: 'The answer is to stop moving the data to the computation, and move the computation to the data. That trick has a name, map reduce, and it is the whole next chapter.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 51.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 51.8, dur: 1.4, ease: ease.move });
  tl.hold(58.0, 1.5);

  return { tl, cam, rigU, flowU, anatU, colK, statsU, askU, weekU, mountU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const flowU = s.get(scene.flowU);
  const anatU = s.get(scene.anatU);
  const colK = s.get(scene.colK);
  const statsU = s.get(scene.statsU);
  const askU = s.get(scene.askU);
  const weekU = s.get(scene.weekU);
  const mountU = s.get(scene.mountU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;
  const kSel = Math.round(colK);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the rig: sales api above, object store below ---- */}
        <g opacity={rigU * dimAll}>
          <rect x={API.x - 95} y={API.y - 32} width={190} height={64} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
          <text x={API.x} y={API.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
            Sales API
          </text>
          <text x={API.x} y={API.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            server log files
          </text>
          {/* object store cylinder */}
          <ellipse cx={STORE.x} cy={STORE.y - 40} rx={95} ry={18} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <rect x={STORE.x - 95} y={STORE.y - 40} width={190} height={85} fill={colors.PANEL} stroke="none" />
          <line x1={STORE.x - 95} y1={STORE.y - 40} x2={STORE.x - 95} y2={STORE.y + 45} stroke={colors.WARM} strokeWidth={1.4} />
          <line x1={STORE.x + 95} y1={STORE.y - 40} x2={STORE.x + 95} y2={STORE.y + 45} stroke={colors.WARM} strokeWidth={1.4} />
          <ellipse cx={STORE.x} cy={STORE.y + 45} rx={95} ry={18} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
          <text x={STORE.x} y={STORE.y + 8} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
            Object Store
          </text>
          <text x={STORE.x} y={STORE.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            Amazon S3
          </text>
        </g>

        {/* ---- the streaming receipts ---- */}
        <g opacity={dimAll}>
          {LINES.map((l, i) => {
            const u = clamp01((flowU - l.delay) * 3.2);
            if (u <= 0) return null;
            const y = API.y + 44 + u * (STORE.y - API.y - 108);
            return (
              <text key={i} x={l.x} y={y} fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace" opacity={0.75 * (1 - Math.max(0, u - 0.85) / 0.15)}>
                {l.text}
              </text>
            );
          })}
        </g>

        {/* ---- the anatomy panel ---- */}
        <g opacity={anatU * dimAll}>
          <text x={560} y={168} fill={colors.TEXT} fontSize={15}>
            one receipt, tab delimited
          </text>
          {ANAT.map((v, i) => {
            const hot = kSel === i || (kSel <= 2 && colK >= 5.9 && i <= 2);
            const x = 560 + i * 92;
            return (
              <g key={i}>
                <rect x={x} y={190} width={84} height={40} rx={7} fill={hot ? colors.PANEL : colors.BG} stroke={hot ? colors.ACCENT : colors.GRID} strokeWidth={hot ? 1.8 : 1} />
                <text x={x + 42} y={215} textAnchor="middle" fill={hot ? colors.ACCENT : colors.TEXT} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  {v}
                </text>
                <text x={x + 42} y={248} textAnchor="middle" fill={colors.MUTED} fontSize={8.5} fontFamily="ui-monospace, monospace">
                  {COLS[i]}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---- the envelope ---- */}
        <g opacity={statsU * dimAll}>
          {STATS.map((chip, i) => (
            <g key={i}>
              <rect x={565} y={300 + i * 46} width={300} height={36} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={715} y={323 + i * 46} textAnchor="middle" fill={chip.c} fontSize={13}>
                {chip.t}
              </text>
            </g>
          ))}
        </g>

        {/* ---- the question + week window ---- */}
        <g opacity={askU * dimAll}>
          <rect x={905} y={300} width={280} height={138} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
          <text x={1045} y={330} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5}>
            the question, precisely
          </text>
          <text x={1045} y={356} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
            top products per category
          </text>
          <text x={1045} y={378} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
            past week only · hourly refresh
          </text>
          {/* the week window slider */}
          <g opacity={weekU}>
            <line x1={935} y1={408} x2={1155} y2={408} stroke={colors.GRID} strokeWidth={2} />
            <rect x={1155 - 70 * weekU} y={400} width={70 * weekU} height={16} rx={4} fill={colors.POSITIVE} opacity={0.5} />
            <text x={1120} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              within_past_week(timestamp)
            </text>
          </g>
        </g>

        {/* ---- the mountain ---- */}
        <g opacity={mountU * dimAll}>
          {Array.from({ length: 12 }, (_, r) => {
            const w = 320 - r * 24;
            const u = clamp01(mountU * 1.6 - (r / 12) * 0.6);
            return (
              <rect key={r} x={860 - w / 2} y={560 - r * 16} width={w * u} height={12} rx={3} fill={colors.MUTED} opacity={0.24 + r * 0.035} />
            );
          })}
          <text x={860} y={596} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
            one week of receipts — too big for one box to sort
          </text>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={225} width={700} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={276} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            move the computation to the data
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily="ui-monospace, monospace">
            Sales API logs → Object Store → MapReduce → sales_rank
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            a billion receipts, and nobody ever loads them all at once
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
