// Linking the Vault: accounts and the async extraction pipeline
//
// Backed by: solutions/system_design/mint/README.md — Step 1 constraints
// (10 million users, 30 million financial accounts, 5 billion transactions a
// month, 500 million reads a month, a 10:1 WRITE to read ratio — write heavy:
// users transact daily but few visit the site daily; ~50 bytes per transaction
// → 250 GB of new transactions a month; ~2,000 transactions/s, ~200 reads/s;
// daily automatic updates only for users active in the past 30 days) and the
// "connects to a financial account" + "extracts transactions" use cases:
// Client → Web Server → Accounts API → accounts table (with
// account_password_hash), then a job on a Queue (Amazon SQS or RabbitMQ), the
// Transaction Extraction Service pulling from the queue, raw logs to the
// Object Store, and categorized rows into the transactions table.
//
// ONE machine: the account links once, then the daily clock drops extraction
// jobs onto a conveyor-belt queue; the extraction worker pulls a job, drains a
// bank's transactions into the store and the table, and the numbers explain
// why none of this happens while the user waits.
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

const P = {
  client: { x: 130, y: 250 },
  web: { x: 330, y: 250 },
  api: { x: 540, y: 250 },
  db: { x: 790, y: 170 },
  queue: { x: 720, y: 360 },
  worker: { x: 980, y: 360 },
  bank: { x: 980, y: 150 },
  store: { x: 1140, y: 500 },
  tdb: { x: 820, y: 520 },
} as const;

const rand = mulberry32(20260719);
const N_TX = 22;
const TXS = Array.from({ length: N_TX }, (_, i) => ({
  delay: i / N_TX,
  wob: rand() * 24 - 12,
}));

const JOBS = [0, 1, 2] as const; // queue slots

const STATS = [
  '5 billion transactions / month',
  '~2,000 writes / s · 200 reads / s',
  'write heavy · 10:1 write to read',
] as const;

const CAM_LINK: CameraState = { x: 480, y: 240, k: 1.2 };
const CAM_QUEUE: CameraState = { x: 850, y: 360, k: 1.3 };
const CAM_DRAIN: CameraState = { x: 960, y: 380, k: 1.15 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rigU: ChannelRef<number>;
  linkU: ChannelRef<number>;
  rowU: ChannelRef<number>;
  clockU: ChannelRef<number>;
  jobsU: ChannelRef<number>;
  pullU: ChannelRef<number>;
  drainU: ChannelRef<number>;
  statsU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rigU = tl.channel('rigU', 0); // client → web → accounts api → sql
  const linkU = tl.channel('linkU', 0); // the link request packet
  const rowU = tl.channel('rowU', 0); // accounts row lands
  const clockU = tl.channel('clockU', 0); // the daily clock
  const jobsU = tl.channel('jobsU', 0); // jobs drop onto the queue
  const pullU = tl.channel('pullU', 0); // worker pulls a job
  const drainU = tl.channel('drainU', 0); // transactions stream from the bank
  const statsU = tl.channel('statsU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the promise —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'You are asked to design a budgeting app. A user hands it the keys to their bank accounts, and it promises to watch every dollar and speak up before the money runs out.',
  });
  tl.tween(rigU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · linking —
  tl.caption({
    at: 7.5,
    dur: 6.5,
    text: 'It starts with a link. The client posts the account credentials through the web server to the accounts service, which writes one row into the accounts table.',
  });
  tl.tween(cam, CAM_LINK, { at: 7.7, dur: 1.4, ease: ease.move });
  tl.tween(linkU, 1, { at: 8.6, dur: 2.6, ease: ease.linear });
  tl.tween(rowU, 1, { at: 11.4, dur: 1.0, ease: ease.enter });
  tl.hold(14.0, 0.5);

  // — Beat 3 · the hash —
  tl.caption({
    at: 14.5,
    dur: 5.5,
    text: 'Note what the row stores: not the password, but a hash of it. The vault keeps a fingerprint, never the key itself.',
  });
  tl.hold(20.0, 0.5);

  // — Beat 4 · why async —
  tl.caption({
    at: 20.5,
    dur: 7,
    text: 'Now the real work: pulling transactions out of the bank. That is slow, minutes sometimes, so nobody does it inside a web request. The accounts service just drops a job on a queue and returns.',
  });
  tl.tween(cam, CAM_QUEUE, { at: 20.7, dur: 1.4, ease: ease.move });
  tl.tween(jobsU, 1, { at: 22.4, dur: 2.4, ease: ease.linear });
  tl.hold(27.5, 0.5);

  // — Beat 5 · the clock —
  tl.caption({
    at: 28.0,
    dur: 6.5,
    text: 'Jobs arrive three ways: when the account is first linked, when the user refreshes by hand, and automatically every day, but only for users active in the past thirty days.',
  });
  tl.tween(clockU, 1, { at: 28.6, dur: 1.2, ease: ease.enter });
  tl.hold(34.5, 0.5);

  // — Beat 6 · the worker drains the bank —
  tl.caption({
    at: 35.0,
    dur: 7,
    text: 'On the far side, the transaction extraction service pulls the next job and drains the account: every transaction streams down as raw log lines into the object store, and as rows into the transactions table.',
  });
  tl.tween(cam, CAM_DRAIN, { at: 35.2, dur: 1.5, ease: ease.move });
  tl.tween(pullU, 1, { at: 35.8, dur: 1.6, ease: ease.linear });
  tl.tween(drainU, 1, { at: 37.6, dur: 4.2, ease: ease.linear });
  tl.hold(42.5, 0.5);

  // — Beat 7 · the numbers —
  tl.caption({
    at: 43.0,
    dur: 7.5,
    text: 'The envelope math explains the shape. Ten million users generate five billion transactions a month, about two thousand writes a second, but only two hundred reads. People spend every day. They check the app far less.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.2, dur: 1.5, ease: ease.move });
  tl.tween(statsU, 1, { at: 44.2, dur: 0.9, ease: ease.pop });
  tl.hold(50.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 51.0,
    dur: 7,
    text: 'So the design is a pipeline built for writes: link once, queue the slow work, drain the banks in the background. What happens to each transaction next is the interesting part.',
  });
  tl.tween(closeU, 1, { at: 51.6, dur: 1.4, ease: ease.move });
  tl.hold(58.0, 1.5);

  return { tl, cam, rigU, linkU, rowU, clockU, jobsU, pullU, drainU, statsU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Box({ x, y, w = 150, h = 58, title, sub, stroke = colors.GRID, opacity = 1 }: {
  x: number; y: number; w?: number; h?: number; title: string; sub?: string; stroke?: string; opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.3} />
      <text x={x} y={y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
        {title}
      </text>
      {sub && (
        <text x={x} y={y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rigU = s.get(scene.rigU);
  const linkU = s.get(scene.linkU);
  const rowU = s.get(scene.rowU);
  const clockU = s.get(scene.clockU);
  const jobsU = s.get(scene.jobsU);
  const pullU = s.get(scene.pullU);
  const drainU = s.get(scene.drainU);
  const statsU = s.get(scene.statsU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the rig ---- */}
        <g opacity={rigU * dimAll}>
          <line x1={P.client.x + 60} y1={P.client.y} x2={P.web.x - 70} y2={P.web.y} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={P.web.x + 70} y1={P.web.y} x2={P.api.x - 75} y2={P.api.y} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={P.api.x + 75} y1={P.api.y - 14} x2={P.db.x - 80} y2={P.db.y} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={P.api.x + 60} y1={P.api.y + 24} x2={P.queue.x - 110} y2={P.queue.y} stroke={colors.GRID} strokeWidth={1.4} />
          <Box x={P.client.x} y={P.client.y} w={110} title="Client" />
          <Box x={P.web.x} y={P.web.y} w={130} title="Web Server" />
          <Box x={P.api.x} y={P.api.y} title="Accounts API" sub="POST /api/v1/account" stroke={colors.ACCENT} />
          <Box x={P.db.x} y={P.db.y} w={170} title="SQL Database" sub="accounts" stroke={colors.POSITIVE} />
          <Box x={P.bank.x} y={P.bank.y} w={170} title="Financial Institution" sub="the user's bank" stroke={colors.WARM} />
        </g>

        {/* accounts row + hash note */}
        <g opacity={rowU * dimAll}>
          <rect x={P.db.x - 105} y={P.db.y + 38} width={230} height={34} rx={7} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
          <text x={P.db.x + 10} y={P.db.y + 59} textAnchor="middle" fill={colors.TEXT} fontSize={9.5} fontFamily="ui-monospace, monospace">
            account_url · login · password_hash
          </text>
        </g>

        {/* link packet */}
        {linkU > 0 && linkU < 1 && (() => {
          const segs = [
            { a: { x: P.client.x + 60, y: P.client.y }, b: { x: P.web.x - 70, y: P.web.y } },
            { a: { x: P.web.x + 70, y: P.web.y }, b: { x: P.api.x - 75, y: P.api.y } },
            { a: { x: P.api.x + 75, y: P.api.y - 14 }, b: { x: P.db.x - 80, y: P.db.y } },
          ];
          const k = Math.min(2, Math.floor(linkU * 3));
          const u = linkU * 3 - k;
          return <Packet from={segs[k].a} to={segs[k].b} u={u} r={7} color={colors.ACCENT} />;
        })()}

        {/* ---- the queue conveyor ---- */}
        <g opacity={clamp01(jobsU * 4) * dimAll}>
          <rect x={P.queue.x - 110} y={P.queue.y - 26} width={220} height={52} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.4} />
          <text x={P.queue.x} y={P.queue.y - 36} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5}>
            Queue
          </text>
          <text x={P.queue.x} y={P.queue.y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
            Amazon SQS / RabbitMQ
          </text>
          {JOBS.map((j) => {
            const u = clamp01(jobsU * 3.2 - j * 0.9);
            if (u <= 0) return null;
            // last job slides out toward the worker when pulled
            const pulled = j === 0 ? pullU : 0;
            const x = lerp(P.queue.x - 88 + j * 62, P.worker.x - 70, pulled);
            return (
              <g key={j} opacity={1}>
                <rect x={x} y={P.queue.y - 14 - (1 - u) * 60} width={52} height={28} rx={6} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.3} opacity={u} />
                <text x={x + 26} y={P.queue.y + 5 - (1 - u) * 60} textAnchor="middle" fill={colors.SECONDARY} fontSize={9.5} fontFamily="ui-monospace, monospace" opacity={u}>
                  job
                </text>
              </g>
            );
          })}
        </g>

        {/* the daily clock */}
        <g opacity={clockU * dimAll}>
          <circle cx={P.queue.x - 170} cy={P.queue.y + 90} r={26} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <line x1={P.queue.x - 170} y1={P.queue.y + 90} x2={P.queue.x - 170} y2={P.queue.y + 72} stroke={colors.WARM} strokeWidth={2} />
          <line x1={P.queue.x - 170} y1={P.queue.y + 90} x2={P.queue.x - 158} y2={P.queue.y + 96} stroke={colors.WARM} strokeWidth={2} />
          <text x={P.queue.x - 170} y={P.queue.y + 136} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
            daily · active users only
          </text>
        </g>

        {/* ---- the worker + drain ---- */}
        <g opacity={clamp01(pullU * 3) * dimAll}>
          <Box x={P.worker.x} y={P.worker.y} w={210} h={64} title="Transaction Extraction Service" sub="pulls from the queue" stroke={colors.ACCENT} />
        </g>
        <g opacity={clamp01(drainU * 4) * dimAll}>
          <Box x={P.store.x} y={P.store.y} w={150} title="Object Store" sub="raw tx logs" stroke={colors.WARM} />
          <Box x={P.tdb.x} y={P.tdb.y} w={170} title="SQL Database" sub="transactions" stroke={colors.POSITIVE} />
        </g>
        {TXS.map((t, i) => {
          const u = clamp01(drainU * 2.2 - t.delay);
          if (u <= 0 || u >= 1) return null;
          const half = i % 2 === 0;
          const from = { x: P.bank.x + t.wob, y: P.bank.y + 40 };
          const mid = { x: P.worker.x + t.wob, y: P.worker.y - 40 };
          const to = half ? { x: P.store.x, y: P.store.y - 36 } : { x: P.tdb.x, y: P.tdb.y - 36 };
          const p = u < 0.5
            ? { x: lerp(from.x, mid.x, u * 2), y: lerp(from.y, mid.y, u * 2) }
            : { x: lerp(mid.x, to.x, u * 2 - 1), y: lerp(mid.y, to.y, u * 2 - 1) };
          return <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={half ? colors.WARM : colors.POSITIVE} opacity={0.85} />;
        })}

        {/* ---- stats ---- */}
        <g opacity={statsU * dimAll}>
          {STATS.map((t, i) => (
            <g key={i}>
              <rect x={110} y={430 + i * 46} width={300} height={36} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={260} y={453 + i * 46} textAnchor="middle" fill={i === 2 ? colors.WARM : colors.TEXT} fontSize={12.5}>
                {t}
              </text>
            </g>
          ))}
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={290} y={220} width={700} height={230} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            a pipeline built for writes
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, monospace">
            link → queue → extract → object store + transactions
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontStyle="italic">
            the user waits for nothing — the queue absorbs the slow parts
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
