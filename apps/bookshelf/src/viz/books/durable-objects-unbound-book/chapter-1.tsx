// A room needs a home
//
// Sources (public; dates UTC):
//   2020-09-28 blog.cloudflare.com/introducing-workers-durable-objects (closed beta;
//     one identity, one active location, private durable state; chat-room example)
//   2022-09-27 blog.cloudflare.com/workerd-open-source-workers-runtime (Apache-2.0)
//   2024-09-26 blog.cloudflare.com/sqlite-in-durable-objects (SQLite beside the object)
//   Aug 2026  celld launch (month only — exact day not established from a primary source)
//   2026-10-09 blog.cloudflare.com/deno-joins-cloudflare + deno.com/blog/cloudflare
//     (1 yr runtime fixes/security releases, 6 mo Deploy operation, JSR continues,
//      rusty_v8 continues — announced plans, not perpetual guarantees)
//   workerd aa494794c44a900592c8281b191302d3b0a6e2a5 "Cluster workerd processes over a
//     shared bucket (#7994)", 2026-10-28 20:11 -07:00 = 2026-10-29 03:11 UTC; initial
//     merge has no alarms.
//   workerd ad78a8fe76b32dd4f19c58d81b2e03e10a996bba "cluster: Durable Object facets
//     (#8113)", 2026-10-31; alarms landed 2992f3f89 (Oct 30 PDT); tested in
//     src/workerd/server/tests/cluster/cluster-test.mjs and
//     src/workerd/server/cluster/alarms.rs / alarms-test.rs.
//
// Machine: one chat-room chamber with a turnstile, on a dated history rail. Two
// divergent copies collapse into one home; client streams pass the turnstile in one
// order; the room multiplies into independent rooms; its runtime shell slides out
// (2022) and back; its interior becomes SQLite pages (2024); celld adds a second host
// and a bucket (Aug 2026); the Deno rail joins (Oct 9); the Oct 29 commit is a
// hinged door; the Oct 31 snapshot adds an alarm bell and a facet branch.
// "lobby" and m40–m42 are illustrative application data.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  Arrow,
  B,
  Backdrop,
  Bucket,
  Host,
  Illus,
  Label,
  Msg,
  Pill,
  UI,
  clamp01,
  lerp,
  seg,
} from './shared/kit';

const { ACCENT, WARM, POSITIVE, SECONDARY, NEGATIVE, TEAL, MUTED, TEXT, PANEL } = colors;

/* ------------------------------------------------------------ layout */
const RAIL_Y = 112;
const RAIL_X0 = 110;
const RAIL_X1 = 1190;
const TICKS = [
  { x: 150, date: 'Sep 2020', event: 'DO beta' },
  { x: 330, date: 'Sep 2022', event: 'workerd OSS' },
  { x: 510, date: 'Sep 2024', event: 'SQLite' },
  { x: 720, date: 'Aug 2026', event: 'celld' },
  { x: 880, date: 'Oct 9', event: 'Deno joins' },
  { x: 1030, date: 'Oct 29 UTC', event: 'aa49479' },
  { x: 1150, date: 'Oct 31', event: 'ad78a8f' },
] as const;

const ROOM = { x: 640, y: 330, r: 78 };
const CLIENTS = [
  { id: 'client 1', y: 250 },
  { id: 'client 2', y: 330 },
  { id: 'client 3', y: 410 },
] as const;
const CLIENT_X = 170;
const TURN = { x: ROOM.x - ROOM.r - 10, y: ROOM.y };

/** Module-scope message schedule (illustrative): arrival order through the turnstile. */
const ARRIVALS = [
  { label: 'm40', client: 0, depart: 0.0 },
  { label: 'm41', client: 2, depart: 0.2 },
  { label: 'm42', client: 1, depart: 0.42 },
] as const;
const TRAVEL = 0.34;

/** Many independent rooms across three machines (beat 5). */
const MACHINES = [250, 640, 1030];
const SMALL_ROOMS: Array<{ x: number; y: number; m: number }> = (() => {
  const out: Array<{ x: number; y: number; m: number }> = [];
  MACHINES.forEach((mx, m) => {
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 2; c++) {
        const x = mx - 60 + c * 120;
        const y = 220 + r * 110;
        if (m === 1 && Math.abs(y - ROOM.y) < 5) continue; // lobby keeps the middle row
        out.push({ x, y, m });
      }
  });
  return out;
})();

/** SQLite page grid inside the room (beat 8): 4×4 pages. */
const PAGES = Array.from({ length: 16 }, (_, i) => ({ c: i % 4, r: Math.floor(i / 4) }));

const CAM_ROOM: CameraState = { x: 600, y: 330, k: 1.3 };
const CAM_INTER: CameraState = { x: 820, y: 330, k: 1.2 };
const CAM_SQL: CameraState = { x: 760, y: 330, k: 1.15 };
const CAM_RAIL: CameraState = { x: 880, y: 200, k: 1.45 };
const CAM_DOOR: CameraState = { x: 950, y: 240, k: 1.45 };
const CAM_NOTES: CameraState = { x: 880, y: 262, k: 1.3 };
const CAM_END: CameraState = { x: 640, y: 350, k: 1.05 };

/**
 * Screen-fit visibility: 1 while the world box [x0,x1]×[y0,y1] sits inside the
 * safe frame (x 20…1260, y 20…598) under camera c, fading to 0 over 28 px of
 * overflow (below 0.3 opacity by the true frame edge). Context that would be chopped by a camera move fades instead.
 */
function fit(c: CameraState, x0: number, x1: number, y0: number, y1: number): number {
  const sx0 = (x0 - c.x) * c.k + 640;
  const sx1 = (x1 - c.x) * c.k + 640;
  const sy0 = (y0 - c.y) * c.k + 360;
  const sy1 = (y1 - c.y) * c.k + 360;
  const over = Math.max(0, 20 - sx0, sx1 - 1260, 20 - sy0, sy1 - 598);
  return clamp01(1 - over / 28);
}

/* ---------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railU = tl.channel('railU', 0);
  const litN = tl.channel('litN', 0); // how many dated markers are lit
  const clientsU = tl.channel('clientsU', 0);
  const twoU = tl.channel('twoU', 0); // two divergent copies
  const mergeU = tl.channel('mergeU', 0); // copies collapse into one home
  const tagsU = tl.channel('tagsU', 0); // identity / coordinate / private state
  const flowU = tl.channel('flowU', 0); // client streams through the turnstile
  const interU = tl.channel('interU', 0); // async interleaving lanes
  const manyU = tl.channel('manyU', 0); // room multiplies across machines
  const hotU = tl.channel('hotU', 0); // one busy room keeps one authority
  const shellU = tl.channel('shellU', 0); // runtime shell slides out (2022)
  const gapU = tl.channel('gapU', 0); // missing distributed operation
  const sqlU = tl.channel('sqlU', 0); // interior becomes SQLite pages
  const ackU = tl.channel('ackU', 0); // local call vs durable ack elsewhere
  const celldU = tl.channel('celldU', 0); // second host + bucket
  const roomDim = tl.channel('roomDim', 0); // room cluster whisper while on the rail
  const denoU = tl.channel('denoU', 0);
  const noteU = tl.channel('noteU', 0);
  const jsrU = tl.channel('jsrU', 0);
  const doorU = tl.channel('doorU', 0);
  const bellU = tl.channel('bellU', 0);
  const endU = tl.channel('endU', 0);

  // 1 — two servers disagree about the room
  tl.caption({ at: 0.5, dur: 10, text: 'A chat message is easy to broadcast until two servers disagree about which room they are running. We will follow one room, and one acknowledged message, through that problem.' });
  tl.tween(railU, 1, { at: B(1) + 0.2, dur: 1.6, ease: ease.draw });
  tl.tween(clientsU, 1, { at: B(1) + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(twoU, 1, { at: B(1) + 2.2, dur: 0.8, ease: ease.enter });

  // 2 — 2020: one identity, one place, private state
  tl.caption({ at: 11.5, dur: 10, text: 'In September twenty twenty, Cloudflare introduced Durable Objects in a closed beta. Each object gave related requests one identity, one place to coordinate, and private durable state.' });
  tl.tween(litN, 1, { at: B(2) + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(mergeU, 1, { at: B(2) + 1.4, dur: 1.4, ease: ease.move });
  tl.tween(tagsU, 1, { at: B(2) + 3.4, dur: 0.8, ease: ease.enter });

  // 3 — every participant reaches the same object; order decided beside the data
  tl.caption({ at: 22.5, dur: 10, text: 'Every participant in our room reaches the same active object. That shared home lets the application decide message order beside its own data, instead of reconciling independent copies later.' });
  tl.tween(cam, CAM_ROOM, { at: B(3) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(tagsU, 0, { at: B(3) + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(flowU, 1, { at: B(3) + 1.0, dur: 7.5, ease: ease.linear });

  // 4 — not one giant transaction
  tl.caption({ at: 33.5, dur: 10, text: 'This does not make every asynchronous handler one giant transaction. The runtime and storage rules still determine when operations may interleave and when their effects become visible.' });
  tl.tween(cam, CAM_INTER, { at: B(4) + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(interU, 1, { at: B(4) + 1.2, dur: 6.0, ease: ease.linear });

  // 5 — many independent rooms; one busy room still has one authority
  tl.caption({ at: 44.5, dur: 10, text: 'Scaling means creating many independent rooms across machines. A single very busy room still has one authority, so dividing the application into objects remains a design decision.' });
  tl.tween(interU, 0, { at: B(5), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(5) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(clientsU, 0.12, { at: B(5) + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(manyU, 1, { at: B(5) + 1.0, dur: 1.6, ease: ease.move });
  tl.tween(hotU, 1, { at: B(5) + 4.4, dur: 4.0, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 330, k: 1.25 }, { at: B(5) + 6.6, dur: 1.4, ease: ease.move });

  // 6 — 2022: open-source runtime shell slides out; state stays on one node
  tl.caption({ at: 55.5, dur: 10, text: 'In September twenty twenty-two, Cloudflare released the Workers runtime as open source. The code already had an escape hatch; the later story is about making that escape hatch practical.' });
  tl.tween(manyU, 0, { at: B(6), dur: 1.0, ease: ease.move });
  tl.tween(hotU, 0, { at: B(6), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(6) + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(litN, 2, { at: B(6) + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(shellU, 1, { at: B(6) + 2.0, dur: 1.5, ease: ease.move });

  // 7 — missing: distributed operation
  tl.caption({ at: 66.5, dur: 10, text: 'The missing part was distributed operation. Cloudflare later described the old self-hosted Durable Object path as suitable for one instance, while its production routing depended on much larger infrastructure.' });
  tl.tween(gapU, 1, { at: B(7) + 0.8, dur: 1.4, ease: ease.draw });

  // 8 — 2024: SQLite beside each object
  tl.caption({ at: 77.5, dur: 10, text: 'In September twenty twenty-four, SQLite brought sequel beside each object. A query can run as a local library call, but a durable acknowledgement can still require work elsewhere.' });
  tl.tween(gapU, 0, { at: B(8), dur: 0.6, ease: ease.move });
  tl.tween(shellU, 0, { at: B(8) + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(litN, 3, { at: B(8) + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_SQL, { at: B(8) + 1.2, dur: 1.3, ease: ease.move });
  tl.tween(sqlU, 1, { at: B(8) + 1.6, dur: 1.6, ease: ease.move });
  tl.tween(ackU, 1, { at: B(8) + 4.4, dur: 3.0, ease: ease.linear });

  // 9 — Aug 2026: celld — machines you control, SQLite cells, shared bucket
  tl.caption({ at: 88.5, dur: 10, text: 'In August twenty twenty-six, celld offered a different operating shape: machines you control, cells backed by SQLite, and a shared bucket that helps decide ownership and preserve state.' });
  tl.tween(ackU, 0, { at: B(9), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(9) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(litN, 4, { at: B(9) + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(celldU, 1, { at: B(9) + 1.4, dur: 2.4, ease: ease.move });

  // 10 — Oct 9: Deno joins Cloudflare
  tl.caption({ at: 99.5, dur: 10, text: 'In October, the Deno team joined Cloudflare. Ryan Dahl described concentrating future work on a shared platform; Cloudflare described celld as a route toward better self-hosting.' });
  tl.tween(roomDim, 1, { at: B(10), dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_RAIL, { at: B(10) + 0.1, dur: 1.5, ease: ease.move });
  tl.tween(litN, 5, { at: B(10) + 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(denoU, 1, { at: B(10) + 1.2, dur: 2.4, ease: ease.draw });

  // 11 — announced transition plans
  tl.caption({ at: 110.5, dur: 10, text: 'Deno announced a year of runtime fixes and security updates, and six months of continued Deploy operation. Those were transition plans announced with the move, not promises of indefinite maintenance.' });
  tl.tween(cam, CAM_NOTES, { at: B(11) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(noteU, 1, { at: B(11) + 0.6, dur: 2.0, ease: ease.enter });

  // 12 — JSR and rusty_v8; not "every Deno project became workerd"
  tl.caption({ at: 121.5, dur: 10, text: 'The announcement also said the Java Script Registry would continue and that rusty V8 would remain supported. We should distinguish those commitments from a claim that every Deno project simply became the Workers runtime.' });
  tl.tween(jsrU, 1, { at: B(12) + 0.6, dur: 4.0, ease: ease.linear });

  // 13 — Oct 29 UTC: the hinged door
  tl.caption({ at: 132.5, dur: 10, text: 'The commit we were given arrived on October twenty-ninth in coordinated universal time. It begins experimental clustering over a shared bucket, including request forwarding, ownership, and recovery after an owner dies.' });
  tl.tween(noteU, 0, { at: B(13), dur: 0.6, ease: ease.move });
  tl.tween(jsrU, 0, { at: B(13), dur: 0.6, ease: ease.move });
  tl.tween(denoU, 0, { at: B(13), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_DOOR, { at: B(13) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(litN, 6, { at: B(13) + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(doorU, 1, { at: B(13) + 1.4, dur: 4.0, ease: ease.move });

  // 14 — Oct 31: alarms + facets; keep versions distinct; settle on the room
  tl.caption({ at: 143.5, dur: 10, text: 'By our October thirty-first snapshot, alarm recovery and object facets had also landed. We will keep these versions distinct while asking the harder question: what makes their guarantees possible?' });
  tl.tween(litN, 7, { at: B(14) + 0.3, dur: 0.8, ease: ease.enter });
  tl.tween(bellU, 1, { at: B(14) + 0.6, dur: 2.0, ease: ease.pop });
  tl.tween(cam, CAM_END, { at: B(14) + 4.6, dur: 1.6, ease: ease.move });
  tl.tween(roomDim, 0, { at: B(14) + 5.4, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: B(14) + 4.8, dur: 1.2, ease: ease.move });
  tl.hold(153.5, 0.5);

  return {
    tl, cam, railU, litN, clientsU, twoU, mergeU, tagsU, flowU, interU, manyU, hotU, shellU, gapU,
    sqlU, ackU, celldU, roomDim, denoU, noteU, jsrU, doorU, bellU, endU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------ subcomponents */

function HistoryRail({ u, lit, dimEarly, end, cam }: { u: number; lit: number; dimEarly: number; end: number; cam: CameraState }) {
  if (u <= 0.001) return null;
  const x1 = lerp(RAIL_X0, RAIL_X1, clamp01(u));
  const railOp = 1 - 0.88 * end;
  return (
    <g>
      <g opacity={railOp}>
        <line x1={RAIL_X0} y1={RAIL_Y} x2={x1} y2={RAIL_Y} stroke={MUTED} strokeWidth={3} strokeLinecap="round" />
        <path d={`M 705 70 L 705 62 L 1180 62 L 1180 70`} fill="none" stroke={MUTED} strokeWidth={1.4} opacity={clamp01(lit - 3) * fit(cam, 705, 1180, 40, 70)} />
        <Label x={942} y={56} text="2026" color={MUTED} size={18} opacity={clamp01(lit - 3) * fit(cam, 900, 985, 40, 70)} bold />
        {TICKS.map((tk, i) => {
          const on = clamp01(lit - i);
          const shown = clamp01((u * (RAIL_X1 - RAIL_X0) - (tk.x - RAIL_X0)) / 40);
          const early = i < 4 ? 1 - 0.7 * dimEarly : 1;
          const hw = Math.max(tk.date.length, tk.event.length) * 18 * 0.3 + 4;
          const inFrame = fit(cam, tk.x - hw, tk.x + hw, RAIL_Y - 40, RAIL_Y + 40);
          return (
            <g key={tk.date} opacity={shown * early * inFrame}>
              <circle cx={tk.x} cy={RAIL_Y} r={lerp(5, 9, on)} fill={on > 0.5 ? WARM : PANEL} stroke={on > 0.5 ? WARM : MUTED} strokeWidth={2} />
              <Label x={tk.x} y={RAIL_Y - 22} text={tk.date} color={on > 0.5 ? TEXT : MUTED} size={18} opacity={0.45 + 0.55 * on} />
              <Label x={tk.x} y={RAIL_Y + 34} text={tk.event} color={on > 0.5 ? WARM : MUTED} size={18} mono={i >= 5} opacity={on} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Clients({ u, flow, merge, cam }: { u: number; flow: number; merge: number; cam: CameraState }) {
  if (u <= 0.001) return null;
  return (
    <g opacity={u * fit(cam, CLIENT_X - 44, CLIENT_X + 44, CLIENTS[0].y - 46, CLIENTS[2].y + 20)}>
      {CLIENTS.map((c) => (
        <g key={c.id}>
          <circle cx={CLIENT_X} cy={c.y} r={16} fill={PANEL} stroke={ACCENT} strokeWidth={2} />
          <Label x={CLIENT_X} y={c.y - 24} text={c.id} color={MUTED} size={18} />
          <line x1={CLIENT_X + 18} y1={c.y} x2={TURN.x - 14} y2={TURN.y} stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 6" opacity={merge * (0.25 + 0.4 * clamp01(flow * 4))} />
        </g>
      ))}
    </g>
  );
}

/** Two servers, two divergent copies of the same room (beat 1), collapsing (beat 2). */
function DivergentCopies({ two, merge }: { two: number; merge: number }) {
  if (two <= 0.001 || merge >= 0.999) return null;
  const xa = lerp(430, ROOM.x, merge);
  const xb = lerp(850, ROOM.x, merge);
  const op = two * (1 - merge);
  const orders = [
    ['m41', 'm42'],
    ['m42', 'm41'],
  ];
  return (
    <g opacity={op}>
      {[xa, xb].map((x, i) => (
        <g key={i}>
          <Host x={x} y={500} label={`server ${i === 0 ? 'A' : 'B'}`} color={i === 0 ? ACCENT : SECONDARY} />
          <circle cx={x} cy={ROOM.y} r={64} fill={PANEL} stroke={NEGATIVE} strokeWidth={2.4} strokeDasharray="7 5" />
          <Label x={x} y={ROOM.y - 82} text="lobby?" color={NEGATIVE} size={20} mono bold />
          {orders[i].map((m, j) => (
            <Label key={m} x={x} y={ROOM.y - 6 + j * 28} text={`${j + 1}. ${m}`} color={TEXT} size={20} mono />
          ))}
        </g>
      ))}
      <Label x={640} y={ROOM.y + 10} text="≠" color={NEGATIVE} size={44} bold opacity={1 - merge * 2} />
      <Label x={640} y={ROOM.y + 120} text="two servers, two orders for one room" color={NEGATIVE} size={20} opacity={1 - merge * 2} />
    </g>
  );
}

function Turnstile({ flow, op }: { flow: number; op: number }) {
  const a = flow * 720;
  return (
    <g transform={`translate(${TURN.x}, ${TURN.y})`} opacity={op}>
      <circle r={7} fill={ACCENT} />
      {[0, 120, 240].map((d) => (
        <line
          key={d}
          x1={0}
          y1={0}
          x2={24 * Math.cos(((a + d) * Math.PI) / 180)}
          y2={24 * Math.sin(((a + d) * Math.PI) / 180)}
          stroke={ACCENT}
          strokeWidth={4}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

/** Messages travelling from clients through the turnstile into the room's order list. */
function Streams({ flow, op }: { flow: number; op: number }) {
  if (op <= 0.001) return null;
  return (
    <g opacity={op}>
      {ARRIVALS.map((m) => {
        const u = seg(flow, m.depart, m.depart + TRAVEL);
        if (u <= 0 || u >= 1) return null;
        const cy = CLIENTS[m.client].y;
        const x = lerp(CLIENT_X + 20, TURN.x - 16, ease.move(u));
        const y = lerp(cy, TURN.y, ease.move(u));
        return <Msg key={m.label} x={x} y={y} label={m.label} color={m.label === 'm42' ? WARM : ACCENT} />;
      })}
    </g>
  );
}

function RoomCore({
  merge,
  flow,
  many,
  hot,
  shell,
  sql,
  celld,
  end,
}: {
  merge: number;
  flow: number;
  many: number;
  hot: number;
  shell: number;
  sql: number;
  celld: number;
  end: number;
}) {
  if (merge <= 0.001) return null;
  const scale = lerp(1, 0.42, many);
  const r = ROOM.r * scale;
  const shellX = lerp(ROOM.x, 980, ease.move(shell));
  return (
    <g opacity={clamp01(merge * 1.4 - 0.2)}>
      {/* interior: private state — order list, then SQLite pages */}
      <g transform={`translate(${ROOM.x}, ${ROOM.y}) scale(${scale})`}>
        <circle r={ROOM.r - 12} fill={PANEL} stroke={WARM} strokeWidth={1.6} opacity={0.9} />
        <g opacity={(1 - sql) * (1 - many)}>
          {ARRIVALS.map((m, i) => {
            const arrived = clamp01((flow - (m.depart + TRAVEL)) / 0.04);
            return (
              <Label key={m.label} x={0} y={-22 + i * 28} text={`${i + 1}. ${m.label}`} color={m.label === 'm42' ? WARM : TEXT} size={20} mono bold={m.label === 'm42'} opacity={arrived} />
            );
          })}
        </g>
        <g opacity={sql * (1 - many)}>
          {PAGES.map((p, i) => (
            <rect key={i} x={-46 + p.c * 24} y={-46 + p.r * 24} width={20} height={20} rx={3} fill={i === 9 ? WARM : PANEL} stroke={WARM} strokeWidth={1.2} opacity={i === 9 ? 0.9 : 0.75} />
          ))}
        </g>
      </g>
      {/* execution shell: the runtime ring (slides out in 2022) */}
      <g transform={`translate(${shellX}, ${ROOM.y}) scale(${scale})`} >
        <circle r={ROOM.r} fill="none" stroke={ACCENT} strokeWidth={8} opacity={0.9} />
        <circle r={ROOM.r + 6 + 14 * hot} fill="none" stroke={WARM} strokeWidth={2} opacity={0.6 * hot} />
      </g>
      <Pill x={ROOM.x} y={ROOM.y - r - 24} text="room: lobby" color={ACCENT} size={18} mono opacity={1 - 0.4 * many} />
      <Label x={ROOM.x} y={ROOM.y + r + 34} text="SQLite" color={WARM} size={20} bold opacity={sql * (1 - many)} />
      {/* tether to its host once celld arrives */}
      <line x1={ROOM.x - 50} y1={ROOM.y + 60} x2={400} y2={486} stroke={ACCENT} strokeWidth={2} strokeDasharray="5 5" opacity={celld} />
    </g>
  );
}

function IdentityTags({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const tags = ['one identity', 'one place to coordinate', 'private durable state'];
  return (
    <g opacity={u}>
      {tags.map((t, i) => (
        <Pill key={t} x={760} y={262 + i * 68} text={t} color={i === 2 ? WARM : ACCENT} size={20} anchor="start" />
      ))}
      <Illus x={560} y={460} text="lobby, m40–m42: illustrative" />
    </g>
  );
}

/** Two handlers on one object: B runs while A awaits — interleaving is real. */
function Interleave({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const X0 = 800;
  const W = 380;
  const lanes = [
    { id: 'handler A', y: 270, segs: [ { a: 0, b: 0.3, run: true }, { a: 0.3, b: 0.66, run: false }, { a: 0.66, b: 0.95, run: true } ] },
    { id: 'handler B', y: 350, segs: [ { a: 0.34, b: 0.6, run: true } ] },
  ];
  const op = clamp01(u * 6);
  const play = clamp01(u * 1.15);
  return (
    <g opacity={op}>
      <rect x={X0 - 20} y={210} width={W + 50} height={260} rx={14} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
      {lanes.map((ln) => (
        <g key={ln.id}>
          <Label x={X0} y={ln.y - 18} text={ln.id} color={MUTED} size={18} anchor="start" />
          {ln.segs.map((sg, i) => {
            const vis = clamp01((play - sg.a) / (sg.b - sg.a));
            if (vis <= 0) return null;
            const x = X0 + sg.a * W;
            const w = (sg.b - sg.a) * W * vis;
            return sg.run ? (
              <rect key={i} x={x} y={ln.y - 8} width={w} height={26} rx={5} fill={ln.id === 'handler A' ? ACCENT : SECONDARY} opacity={0.85} />
            ) : (
              <g key={i}>
                <line x1={x} y1={ln.y + 5} x2={x + w} y2={ln.y + 5} stroke={MUTED} strokeWidth={2} strokeDasharray="5 5" />
                <Label x={x + ((sg.b - sg.a) * W) / 2} y={ln.y + 40} text="awaiting I/O" color={MUTED} size={18} opacity={vis} />
              </g>
            );
          })}
        </g>
      ))}
      <line x1={X0 + 0.34 * W} y1={250} x2={X0 + 0.34 * W} y2={380} stroke={WARM} strokeWidth={1.5} strokeDasharray="3 4" opacity={seg(u, 0.4, 0.5)} />
      <Label x={X0 + W / 2} y={420} text="not one giant transaction" color={WARM} size={20} bold opacity={seg(u, 0.55, 0.7)} />
      <Label x={X0 + W / 2} y={452} text="runtime + storage rules decide" color={TEXT} size={18} opacity={seg(u, 0.7, 0.85)} />
    </g>
  );
}

function ManyRooms({ u, hot, cam }: { u: number; hot: number; cam: CameraState }) {
  if (u <= 0.001) return null;
  return (
    <g>
      {MACHINES.map((mx, i) => (
        <g key={mx} opacity={u}>
          <rect x={mx - 130} y={180} width={260} height={360} rx={16} fill="none" stroke={MUTED} strokeWidth={1.4} strokeDasharray="6 6" />
          <Label x={mx} y={572} text={`machine ${i + 1}`} color={MUTED} size={18} opacity={fit(cam, mx - 50, mx + 50, 556, 578)} />
        </g>
      ))}
      {SMALL_ROOMS.map((r, i) => {
        const g = clamp01(u * 1.6 - (i / SMALL_ROOMS.length) * 0.6);
        return (
          <g key={i} opacity={g * (1 - 0.82 * hot)}>
            <circle cx={r.x} cy={r.y} r={30} fill={PANEL} stroke={ACCENT} strokeWidth={2} />
            <Label x={r.x} y={r.y + 6} text="room" color={MUTED} size={16} />
          </g>
        );
      })}
      {/* the busy lobby: many packets, still one turnstile */}
      {Array.from({ length: 10 }, (_, i) => {
        const p = (hot * 3 + i / 10) % 1;
        if (hot <= 0.001) return null;
        const a = (i / 10) * Math.PI * 2;
        const x = ROOM.x + Math.cos(a) * lerp(140, 40, p);
        const y = ROOM.y + Math.sin(a) * lerp(140, 40, p);
        return <circle key={i} cx={x} cy={y} r={5} fill={WARM} opacity={Math.min(1, hot * 4) * (1 - p)} />;
      })}
      <Pill x={ROOM.x} y={ROOM.y + 86} text="busy room · still one authority" color={WARM} size={18} opacity={seg(hot, 0.1, 0.3)} />
    </g>
  );
}

function OpenShell({ shell, gap }: { shell: number; gap: number }) {
  if (shell <= 0.001) return null;
  return (
    <g>
      <g opacity={seg(shell, 0.5, 1)}>
        <Pill x={980} y={225} text="workerd · Apache-2.0" color={ACCENT} size={20} mono />
        <Label x={980} y={445} text="escape hatch: run it yourself" color={TEXT} size={18} />
        <Host x={ROOM.x} y={500} label="one node" color={WARM} />
        <Label x={ROOM.x} y={440} text="state stays on one node" color={WARM} size={18} />
      </g>
      <g opacity={gap}>
        <line x1={ROOM.x + 90} y1={ROOM.y} x2={980 - 90} y2={ROOM.y} stroke={NEGATIVE} strokeWidth={3} strokeDasharray="10 8" />
        <line x1={(ROOM.x + 980) / 2} y1={ROOM.y} x2={(ROOM.x + 980) / 2} y2={202} stroke={NEGATIVE} strokeWidth={1.5} />
        <Pill x={(ROOM.x + 980) / 2} y={186} text="missing: distributed operation" color={NEGATIVE} size={18} fill={colors.BG} />
        <Label x={ROOM.x} y={590} text="old self-hosted path: one instance" color={TEXT} size={18} />
        <Label x={1010} y={500} text="production routing:" color={MUTED} size={18} />
        <Label x={1010} y={526} text="much larger infrastructure" color={MUTED} size={18} />
        <Illus x={880} y={560} text="as Cloudflare later described it (Oct 2026)" />
      </g>
    </g>
  );
}

function LocalVsDurable({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const local = seg(u, 0, 0.35);
  const far = seg(u, 0.35, 1);
  return (
    <g>
      <g opacity={local}>
        <path d={`M ${ROOM.x + 30} ${ROOM.y - 70} C ${ROOM.x + 150} ${ROOM.y - 140}, ${ROOM.x + 170} ${ROOM.y - 20}, ${ROOM.x + 82} ${ROOM.y - 30}`} fill="none" stroke={POSITIVE} strokeWidth={3} />
        <Pill x={ROOM.x + 200} y={ROOM.y - 120} text="query: local library call" color={POSITIVE} size={18} anchor="start" />
      </g>
      <g opacity={far > 0 ? 1 : 0}>
        <Arrow x1={ROOM.x + 90} y1={ROOM.y + 40} x2={1150} y2={ROOM.y + 40} u={far} color={WARM} dash="8 6" width={2.6} />
        <Pill x={ROOM.x + 330} y={ROOM.y + 80} text="durable ack: may need work elsewhere" color={WARM} size={18} opacity={seg(far, 0.4, 0.8)} />
        <Label x={1170} y={ROOM.y + 48} text="?" color={WARM} size={30} bold opacity={seg(far, 0.8, 1)} />
      </g>
    </g>
  );
}

function CelldShape({ u, end }: { u: number; end: number }) {
  if (u <= 0.001) return null;
  const a = seg(u, 0, 0.4);
  const b = seg(u, 0.3, 0.7);
  const c = seg(u, 0.6, 1);
  return (
    <g>
      <Host x={400} y={520} label="host A" color={ACCENT} opacity={a} />
      <Host x={880} y={520} label="host B" color={SECONDARY} opacity={b} />
      <Bucket x={640} y={530} w={170} h={80} opacity={c} label="bucket" />
      <line x1={450} y1={530} x2={555} y2={530} stroke={TEAL} strokeWidth={2} strokeDasharray="4 5" opacity={c} />
      <line x1={830} y1={530} x2={725} y2={530} stroke={TEAL} strokeWidth={2} strokeDasharray="4 5" opacity={c} />
      <g opacity={c * (1 - end)}>
        <Pill x={1210} y={262} text="machines you control" color={TEXT} size={18} anchor="end" />
        <Pill x={1210} y={318} text="cells backed by SQLite" color={WARM} size={18} anchor="end" />
        <Pill x={1210} y={374} text="bucket: ownership + state" color={TEAL} size={18} anchor="end" />
        <Pill x={120} y={262} text="celld · Aug 2026" color={TEXT} size={20} anchor="start" bold />
      </g>
    </g>
  );
}

function DenoRail({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const joinX = TICKS[4].x;
  const len = 520;
  // arrives from the left above the event labels, so it never crosses 'celld' or 'Deno joins'
  const d = `M 520 250 C 640 250, 760 150, ${joinX - 68} ${RAIL_Y + 10} L ${joinX - 9} ${RAIL_Y + 1}`;
  return (
    <g>
      <path d={d} fill="none" stroke={SECONDARY} strokeWidth={3.5} strokeDasharray={len} strokeDashoffset={len * (1 - seg(u, 0, 0.6))} />
      <Pill x={520} y={250} text="Deno" color={SECONDARY} size={20} bold opacity={seg(u, 0, 0.2)} />
      <g opacity={seg(u, 0.55, 0.8)}>
        <Pill x={1000} y={176} text="Ryan Dahl: future work on a shared platform" color={SECONDARY} size={18} />
      </g>
      <g opacity={seg(u, 0.75, 1)}>
        <Pill x={1000} y={226} text="Cloudflare: celld → better self-hosting" color={ACCENT} size={18} />
      </g>
    </g>
  );
}

function Footnotes({ note, jsr }: { note: number; jsr: number }) {
  if (note <= 0.001 && jsr <= 0.001) return null;
  const strike = seg(jsr, 0.55, 0.85);
  return (
    <g>
      <g opacity={note}>
        <rect x={500} y={262} width={760} height={98} rx={12} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
        <Label x={520} y={290} text="announced with the move — transition plans:" color={MUTED} size={18} anchor="start" />
        <Pill x={520} y={326} text="1 yr runtime fixes + security" color={TEXT} size={18} anchor="start" />
        <Pill x={880} y={326} text="6 mo Deploy operation" color={TEXT} size={18} anchor="start" />
        <Label x={1180} y={290} text="not indefinite" color={WARM} size={18} anchor="end" bold />
      </g>
      <g opacity={jsr}>
        <rect x={500} y={370} width={760} height={70} rx={12} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
        <Pill x={520} y={405} text="JSR continues" color={POSITIVE} size={18} anchor="start" opacity={seg(jsr, 0, 0.2)} />
        <Pill x={700} y={405} text="rusty_v8 supported" color={POSITIVE} size={18} mono anchor="start" opacity={seg(jsr, 0.15, 0.35)} />
        <g opacity={seg(jsr, 0.35, 0.55)}>
          <text x={940} y={412} fill={NEGATIVE} fontSize={18} fontFamily={UI}>every Deno project = workerd</text>
          <line x1={936} y1={406} x2={936 + 268 * strike} y2={406} stroke={NEGATIVE} strokeWidth={3} />
        </g>
      </g>
    </g>
  );
}

function CommitDoor({ u, quiet }: { u: number; quiet: number }) {
  if (u <= 0.001) return null;
  const x = TICKS[5].x;
  const open = seg(u, 0.1, 0.45);
  const w = 64 * Math.cos(open * 1.25);
  const chips = ['request forwarding', 'ownership', 'recovery after owner death'];
  return (
    <g opacity={seg(u, 0, 0.1) * (1 - 0.88 * quiet)}>
      <line x1={x} y1={RAIL_Y + 42} x2={x} y2={RAIL_Y + 50} stroke={WARM} strokeWidth={2} />
      <rect x={x - 32} y={RAIL_Y + 50} width={64} height={100} fill={colors.BG} stroke={MUTED} strokeWidth={2} />
      <rect x={x - 32} y={RAIL_Y + 50} width={64} height={100} fill={WARM} opacity={0.18 * open} />
      <rect x={x - 32} y={RAIL_Y + 50} width={Math.max(4, w)} height={100} fill={PANEL} stroke={WARM} strokeWidth={2.4} />
      <circle cx={x - 32 + Math.max(4, w) - 9} cy={RAIL_Y + 102} r={3.5} fill={WARM} />
      <g opacity={seg(u, 0.35, 0.55)}>
        <Pill x={x} y={RAIL_Y + 196} text="aa49479 · 2026-10-29 03:11 UTC" color={WARM} size={18} mono fill={colors.BG} />
        <Label x={x} y={RAIL_Y + 236} text="experimental: cluster over a shared bucket" color={TEXT} size={18} />
      </g>
      {chips.map((c, i) => (
        <Pill key={c} x={x - 50} y={RAIL_Y + 62 + i * 46} text={c} color={ACCENT} size={18} anchor="end" fill={colors.BG} opacity={seg(u, 0.55 + i * 0.12, 0.67 + i * 0.12)} />
      ))}
      <Illus x={x - 130} y={RAIL_Y + 266} opacity={seg(u, 0.9, 1)} text="initial merge: no alarms yet" />
    </g>
  );
}

function BellFacet({ u, end }: { u: number; end: number }) {
  if (u <= 0.001) return null;
  const x = TICKS[6].x;
  const y = RAIL_Y - 48;
  const s = 0.6 + 0.4 * clamp01(u);
  return (
    <g opacity={clamp01(u) * (1 - end)}>
      <g transform={`translate(${x + 44}, ${y + 40}) scale(${s})`}>
        <path d="M -14 8 Q -14 -14 0 -16 Q 14 -14 14 8 L 18 13 L -18 13 Z" fill={WARM} />
        <circle cx={0} cy={17} r={4} fill={WARM} />
      </g>
      <path d={`M ${x} ${RAIL_Y} L ${x + 30} ${RAIL_Y + 60} M ${x + 30} ${RAIL_Y + 60} L ${x + 10} ${RAIL_Y + 110} M ${x + 30} ${RAIL_Y + 60} L ${x + 56} ${RAIL_Y + 110}`} stroke={SECONDARY} strokeWidth={3} fill="none" />
      <circle cx={x + 10} cy={RAIL_Y + 110} r={6} fill={SECONDARY} />
      <circle cx={x + 56} cy={RAIL_Y + 110} r={6} fill={SECONDARY} />
      <Pill x={x + 50} y={RAIL_Y + 150} text="alarms + facets (tested)" color={TEXT} size={18} anchor="end" />
      <Pill x={x + 50} y={RAIL_Y + 196} text="ad78a8f · 2026-10-31" color={WARM} size={18} mono anchor="end" />
      <Label x={x + 50} y={RAIL_Y + 238} text="not a completeness claim" color={MUTED} size={18} anchor="end" />
    </g>
  );
}

/* --------------------------------------------------------------- frame */
export function Render({ s }: { s: SceneState }) {
  const flow = s.get(scene.flowU);
  const merge = s.get(scene.mergeU);
  const many = s.get(scene.manyU);
  const hot = s.get(scene.hotU);
  const shell = s.get(scene.shellU);
  const sql = s.get(scene.sqlU);
  const celld = s.get(scene.celldU);
  const roomDim = s.get(scene.roomDim);
  const end = s.get(scene.endU);
  const inter = s.get(scene.interU);
  const cam = s.get(scene.cam);
  const roomOp = 1 - 0.94 * roomDim;
  const clientsOp = s.get(scene.clientsU) * (1 - many) * (1 - shell) * (1 - sql) * (1 - 0.9 * roomDim);
  return (
    <>
      <Backdrop />
      <Camera {...cam}>
        <HistoryRail u={s.get(scene.railU)} lit={s.get(scene.litN)} dimEarly={roomDim * (1 - end)} end={end} cam={cam} />
        <g opacity={roomOp}>
          <Clients u={clientsOp} flow={flow} merge={merge} cam={cam} />
          <ManyRooms u={many} hot={hot} cam={cam} />
          <RoomCore merge={merge} flow={flow} many={many} hot={hot} shell={shell} sql={sql} celld={celld} end={end} />
          <Turnstile flow={flow} op={clamp01(merge) * (1 - many) * (1 - shell)} />
          <Streams flow={flow} op={clientsOp > 0.5 ? 1 : clientsOp * 2} />
          <IdentityTags u={s.get(scene.tagsU)} />
          <OpenShell shell={shell} gap={s.get(scene.gapU)} />
          <LocalVsDurable u={s.get(scene.ackU)} />
          <CelldShape u={celld} end={end} />
        </g>
        <DivergentCopies two={s.get(scene.twoU)} merge={merge} />
        <Interleave u={inter} />
        <DenoRail u={s.get(scene.denoU) * (1 - end)} />
        <Footnotes note={s.get(scene.noteU)} jsr={s.get(scene.jsrU)} />
        <CommitDoor u={s.get(scene.doorU)} quiet={Math.max(end, clamp01(s.get(scene.bellU) * 1.2))} />
        <BellFacet u={s.get(scene.bellU)} end={end} />
        <Pill x={640} y={190} text="snapshot · Oct 31 2026 · workerd ad78a8f" color={WARM} size={20} mono opacity={end} fill={colors.BG} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
