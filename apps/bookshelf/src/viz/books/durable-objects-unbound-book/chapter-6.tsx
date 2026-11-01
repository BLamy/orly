// What becomes portable
//
// Sources:
//   workerd aa49479 (2026-10-29 UTC) — initial cluster merge: experimental Config.cluster,
//     shared bucket, no alarms. workerd ad78a8f (2026-10-31) — current snapshot:
//     src/workerd/server/cluster/alarms.rs, alarms-test.rs and
//     src/workerd/server/tests/cluster/cluster-test.mjs exercise an owner's alarm, a
//     survivor running the alarm after its owner is killed, and missing-node-record
//     adoption (one observed firing per tested scenario — not arbitrary exactly-once).
//   workerd ownership.rs / owner.rs / log.rs (as in chapters 2–5); lease.rs (chapter 3).
//   celld v0.6.3 docs/guarantees.md, docs/limitations.md, docs/cloudflare-compat.md —
//     fleet proof, store requirements, never expire reserved state via lifecycle rules.
//   2026-10-09 blog.cloudflare.com/deno-joins-cloudflare + deno.com/blog/cloudflare —
//     stated direction: first-class self-hosting.
//   No percentiles, prices or benchmarks: the latency pipeline widths are illustrative.
//
// Machine: the same room (with its acknowledged-prefix ruler) passes a row of fault
// apertures — partition, conditional writes, clock skew, current epoch, retained
// history — each labeled with the precondition it removes and the action it blocks.
// Then the room drives a latency pipeline, carries an alarm bell to a survivor, and
// moves inside a portable operator boundary while bucket and operations stay visible.
// "lobby", m42, hosts A/B are illustrative.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  B,
  Backdrop,
  Bucket,
  Host,
  Illus,
  Label,
  MONO,
  Msg,
  Pill,
  Takeaway,
  WarnCard,
  clamp01,
  lerp,
  seg,
} from './shared/kit';

const { ACCENT, WARM, POSITIVE, SECONDARY, NEGATIVE, TEAL, MUTED, TEXT, PANEL } = colors;

/* ------------------------------------------------------------ layout */
const TRACK_Y = 300;
const APS = [
  { x: 260, label: 'owner ↔ bucket', check: 'reachable' },
  { x: 460, label: 'conditional writes', check: 'honored' },
  { x: 660, label: 'clock skew ≤ 2 s', check: 'within bound' },
  { x: 860, label: 'current epoch', check: 'matches' },
  { x: 1060, label: 'retained history', check: 'kept' },
] as const;
const BKT = { x: 640, y: 525 };

interface Pos {
  x: number;
  y: number;
  k: number;
}
const ROOM_START: Pos = { x: 110, y: TRACK_Y, k: 1 };

/** Pipeline lanes — illustrative widths only (no measurements). Each annotation owns a lane. */
const PIPE = { x0: 250, h: 46, title: 150, note: 174, badge: 214, bar: 262, celldLabel: 362, celldBar: 398, domainTop: 225, domainBot: 465, noPath: 500 };

/* Cameras fit the complete active group (WarnCard at y 62 … bucket/hosts) above screen y 610. */
const CAM_AP1: CameraState = { x: 520, y: 372, k: 1.13 };
const CAM_AP2: CameraState = { x: 560, y: 359, k: 1.18 };
const CAM_AP5: CameraState = { x: 700, y: 372, k: 1.13 };
const CAM_PIPE: CameraState = { x: 620, y: 330, k: 1.2 };
const CAM_ALARM: CameraState = { x: 640, y: 400, k: 1.12 };

/** Half-width of a gate including its widest label (≈ 'retained history' at 18 px). */
const GATE_HALF = 85;

/** Alarm beat lanes (world y), framed by CAM_ALARM: badges · narration lane · room · hosts · caveat panel. */
const ALARM = { badgeX: 150, badge1: 110, badge2: 150, lane: 205, host: 450, panel: 528 };

/* ---------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const room = tl.channel<Pos>('room', ROOM_START);
  const trackU = tl.channel('trackU', 0); // apertures visible
  const passU = tl.channel('passU', 0); // healthy pass (checks light)
  const partU = tl.channel('partU', 0);
  const lieU = tl.channel('lieU', 0);
  const lifeU = tl.channel('lifeU', 0);
  const pipeU = tl.channel('pipeU', 0);
  const stretchU = tl.channel('stretchU', 0);
  const fleetU = tl.channel('fleetU', 0);
  const alarmU = tl.channel('alarmU', 0);
  const questU = tl.channel('questU', 0);
  const portU = tl.channel('portU', 0);
  const evalU = tl.channel('evalU', 0);
  const datedU = tl.channel('datedU', 0);
  const histU = tl.channel('histU', 0);
  const contractU = tl.channel('contractU', 0);
  const quietU = tl.channel('quietU', 0); // platform composition recedes for good
  const endU = tl.channel('endU', 0);

  // 1 — remove assumptions one at a time; healthy pass first
  tl.caption({ at: 0.5, dur: 10, text: 'We can now test the design by removing its assumptions one at a time. A durable distributed database is built from these boundaries, not from the word durable in a product name.' });
  tl.tween(trackU, 1, { at: B(1) + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(passU, 1, { at: B(1) + 2.0, dur: 6.4, ease: ease.linear });
  tl.tween(room, { x: 1180, y: TRACK_Y, k: 1 }, { at: B(1) + 2.0, dur: 6.4, ease: ease.linear });

  // 2 — partition owner from bucket
  tl.caption({ at: 11.5, dur: 10, text: 'Partition the owner from the bucket. In the bucket-proof path, new acknowledgements cannot cross the durability gate, and lease expiry eventually forces the owner to stop serving.' });
  tl.tween(room, { x: APS[0].x, y: TRACK_Y, k: 1 }, { at: B(2) + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_AP1, { at: B(2) + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(partU, 1, { at: B(2) + 1.6, dur: 7.8, ease: ease.linear });

  // 3 — the store ignores conditional writes
  tl.caption({ at: 22.5, dur: 10, text: 'Let the store ignore conditional writes, and two contenders can both believe they won. That breaks the foundation; no clever SQLite replay can repair an ownership primitive that lies.' });
  tl.tween(partU, 0, { at: B(3), dur: 0.6, ease: ease.move });
  tl.tween(room, { x: APS[1].x, y: TRACK_Y, k: 1 }, { at: B(3) + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_AP2, { at: B(3) + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(lieU, 1, { at: B(3) + 1.4, dur: 8.0, ease: ease.linear });

  // 4 — lifecycle rules delete protocol state
  tl.caption({ at: 33.5, dur: 10, text: "Delete reserved history or ownership records with a lifecycle rule, and recovery can fail or lose its foundation. Operators must preserve the protocol's state, not treat every bucket object as disposable." });
  tl.tween(lieU, 0, { at: B(4), dur: 0.6, ease: ease.move });
  tl.tween(room, { x: APS[4].x, y: TRACK_Y, k: 1 }, { at: B(4) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_AP5, { at: B(4) + 0.3, dur: 1.5, ease: ease.move });
  tl.tween(lifeU, 1, { at: B(4) + 1.6, dur: 7.8, ease: ease.linear });

  // 5 — latency budget
  tl.caption({ at: 44.5, dur: 10, text: 'There is also a latency budget. Local sequel can be fast while a durable response waits for an object-store upload and an ownership check, especially when storage is far from compute.' });
  tl.tween(lifeU, 0, { at: B(5), dur: 0.6, ease: ease.move });
  tl.tween(trackU, 0, { at: B(5), dur: 0.8, ease: ease.move });
  tl.tween(room, { x: 170, y: 330, k: 0.8 }, { at: B(5) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAM_PIPE, { at: B(5) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(pipeU, 1, { at: B(5) + 1.4, dur: 3.2, ease: ease.draw });
  tl.tween(stretchU, 1, { at: B(5) + 5.4, dur: 2.6, ease: ease.move });

  // 6 — celld follower proof: shorter path, more machinery
  tl.caption({ at: 55.5, dur: 10, text: "Celld's follower proof can shorten that waiting path, while adding follower disks and recovery work. Neither path removes the physical cost of getting recoverable bytes beyond one failure domain." });
  tl.tween(fleetU, 1, { at: B(6) + 0.6, dur: 8.4, ease: ease.linear });

  // 7 — current snapshot: alarm on a survivor
  tl.caption({ at: 66.5, dur: 10, text: "By the October thirty-first workerd snapshot, tests also exercise an alarm running on a survivor after its owner is killed. That is concrete progress beyond the initial cluster merge's alarm gap." });
  tl.tween(pipeU, 0, { at: B(7), dur: 0.8, ease: ease.move });
  tl.tween(fleetU, 0, { at: B(7), dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_ALARM, { at: B(7) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(room, { x: 360, y: 300, k: 0.9 }, { at: B(7) + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(alarmU, 1, { at: B(7) + 1.4, dur: 8.0, ease: ease.linear });
  tl.tween(room, { x: 920, y: 300, k: 0.9 }, { at: B(7) + 5.6, dur: 1.4, ease: ease.move });

  // 8 — tests are not exactly-once
  tl.caption({ at: 77.5, dur: 10, text: 'Those tests do not prove that every application side effect happens exactly once. Alarm discovery, durable scheduling state, handler execution, and external effects remain different questions.' });
  tl.tween(questU, 1, { at: B(8) + 0.6, dur: 6.0, ease: ease.linear });

  // 9 — choose where the programming model runs
  tl.caption({ at: 88.5, dur: 10, text: 'The new freedom is choosing where the programming model runs. Our room can keep its identity and storage model while its compute moves onto infrastructure we operate.' });
  tl.tween(alarmU, 0, { at: B(9), dur: 0.8, ease: ease.move });
  tl.tween(questU, 0, { at: B(9), dur: 0.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(9) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(room, { x: 380, y: 300, k: 0.9 }, { at: B(9) + 0.2, dur: 1.0, ease: ease.move });
  tl.tween(portU, 1, { at: B(9) + 1.2, dur: 6.0, ease: ease.linear });
  tl.tween(room, { x: 900, y: 290, k: 0.9 }, { at: B(9) + 3.8, dur: 1.8, ease: ease.move });

  // 10 — not every service or guarantee
  tl.caption({ at: 99.5, dur: 10, text: 'That does not automatically reproduce every Cloudflare service or operational guarantee. Runtime portability, supported APIs, network services, and production operations need to be evaluated separately.' });
  tl.tween(evalU, 1, { at: B(10) + 0.6, dur: 6.0, ease: ease.linear });

  // 11 — direction vs dated experimental commits
  tl.caption({ at: 110.5, dur: 10, text: 'Cloudflare and the Deno team describe the shared effort as making self-hosting first class. The direction is clear; the inspected commits are a dated, experimental implementation rather than a finished promise.' });
  tl.tween(evalU, 0, { at: B(11), dur: 0.6, ease: ease.move });
  tl.tween(datedU, 1, { at: B(11) + 0.6, dur: 6.0, ease: ease.linear });

  // 12 — the history, compressed
  tl.caption({ at: 121.5, dur: 10, text: 'The history began with coordinated state in twenty twenty, gained an open runtime in twenty twenty-two, and brought SQLite beside objects in twenty twenty-four. Celld made a different operating model concrete.' });
  tl.tween(datedU, 0, { at: B(12), dur: 0.6, ease: ease.move });
  tl.tween(quietU, 1, { at: B(12) + 0.1, dur: 0.6, ease: ease.move });
  tl.tween(histU, 1, { at: B(12) + 0.4, dur: 7.0, ease: ease.linear });

  // 13 — the contract exchange
  tl.caption({ at: 132.5, dur: 10, text: 'The key exchange is now visible: a qualified storage service supplies serialization and durable bytes; the runtime supplies ownership, capture, output gates, and recovery. Each side has a contract.' });
  tl.tween(histU, 0, { at: B(13), dur: 0.6, ease: ease.move });
  tl.tween(contractU, 1, { at: B(13) + 0.6, dur: 6.5, ease: ease.linear });

  // 14 — the contracts line up
  tl.caption({ at: 143.5, dur: 10, text: "Our acknowledged message survives the owner's death because those contracts line up. Durable Objects become more portable when the machinery behind that promise can travel with the application." });
  tl.tween(contractU, 0, { at: B(14) + 0.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 640, y: 380, k: 1.05 }, { at: B(14) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(endU, 1, { at: B(14) + 0.8, dur: 1.2, ease: ease.enter });
  tl.hold(153.5, 0.5);

  return {
    tl, cam, room, trackU, passU, partU, lieU, lifeU, pipeU, stretchU, fleetU, alarmU, questU, portU, evalU,
    datedU, histU, contractU, quietU, endU,
  };
}

const scene = buildScene();

/* ------------------------------------------------------ subcomponents */

/** The persistent room with its acknowledged-prefix ruler attached. */
function RoomToken({ p, color = ACCENT, op = 1, fenced = 0 }: { p: Pos; color?: string; op?: number; fenced?: number }) {
  if (op <= 0.001) return null;
  const c = fenced > 0.5 ? MUTED : color;
  return (
    <g transform={`translate(${p.x}, ${p.y}) scale(${p.k})`} opacity={op}>
      <circle r={46} fill={PANEL} stroke={c} strokeWidth={3} />
      <text y={7} textAnchor="middle" fill={c} fontSize={20} fontFamily={MONO} fontWeight={700}>
        lobby
      </text>
      <rect x={-62} y={58} width={124} height={30} rx={6} fill={colors.BG} stroke={POSITIVE} strokeWidth={2} />
      <text y={79} textAnchor="middle" fill={POSITIVE} fontSize={18} fontFamily={MONO}>
        acked …m42
      </text>
      {fenced > 0.01 ? (
        <text y={-60} textAnchor="middle" fill={NEGATIVE} fontSize={18} fontFamily={MONO} opacity={fenced}>
          stopped serving
        </text>
      ) : null}
    </g>
  );
}

function Apertures({ u, pass, room, part, lie, life, cam }: { u: number; pass: number; room: Pos; part: number; lie: number; life: number; cam: CameraState }) {
  if (u <= 0.001) return null;
  const failing = [part, lie, 0, 0, life];
  // while one assumption is removed, the other gates step back; any gate the
  // camera would chop at the frame edge is hidden instead of shown cut off
  const focus = seg(Math.max(part, lie, life), 0, 0.12);
  const visL = cam.x - 640 / cam.k;
  const visR = cam.x + 640 / cam.k;
  return (
    <g opacity={u}>
      <line x1={70} y1={TRACK_Y} x2={1220} y2={TRACK_Y} stroke={MUTED} strokeWidth={1.4} strokeDasharray="3 7" opacity={1 - 0.7 * focus} />
      {APS.map((a, i) => {
        const passed = pass > 0 && room.x > a.x + 40 && failing[i] <= 0.01;
        const bad = seg(failing[i], 0.15, 0.3);
        const c = bad > 0.5 ? NEGATIVE : passed ? POSITIVE : MUTED;
        const overflow = Math.max(0, visL - (a.x - GATE_HALF), a.x + GATE_HALF - visR);
        const inView = clamp01(1 - overflow / 30);
        const active = failing[i] > 0.01;
        const op = inView * (active ? 1 : 1 - 0.6 * focus);
        if (op <= 0.001) return null;
        return (
          <g key={a.label} opacity={op}>
            <rect x={a.x - 52} y={TRACK_Y - 104} width={104} height={208} rx={12} fill="none" stroke={c} strokeWidth={3} />
            <rect x={a.x - 52} y={TRACK_Y - 104} width={104} height={208} rx={12} fill={c} opacity={0.06} />
            <Label x={a.x} y={TRACK_Y - 120} text={a.label} color={c === MUTED ? TEXT : c} size={18} />
            <Label x={a.x} y={TRACK_Y + 136} text={bad > 0.5 ? 'removed' : passed ? `✓ ${a.check}` : a.check} color={c} size={18} />
          </g>
        );
      })}
    </g>
  );
}

function Partition({ u, room }: { u: number; room: Pos }) {
  if (u <= 0.001) return null;
  const cut = seg(u, 0.1, 0.25);
  const gate = seg(u, 0.3, 0.45);
  const lease = seg(u, 0.5, 0.85);
  // cut mark 70% along the room→bucket link, below the gate status row
  const mx = lerp(room.x + 20, BKT.x - 120, 0.7) + 20;
  const my = lerp(TRACK_Y + 90, BKT.y - 30, 0.7) + 20;
  return (
    <g>
      <line x1={room.x + 20} y1={TRACK_Y + 90} x2={BKT.x - 120} y2={BKT.y - 30} stroke={TEAL} strokeWidth={2.4} strokeDasharray="6 5" opacity={seg(u, 0, 0.1)} />
      <path d={`M ${mx - 20} ${my - 20} l 10 12 l -8 6 l 18 22`} fill="none" stroke={NEGATIVE} strokeWidth={4} opacity={cut} />
      {/* ack gate shut */}
      <g transform={`translate(${room.x + 76}, ${TRACK_Y})`} opacity={gate}>
        <rect x={-7} y={-40} width={14} height={80} rx={3} fill={NEGATIVE} />
        <Label x={30} y={-46} text="no ack" color={NEGATIVE} size={18} />
      </g>
      {/* lease bar drains */}
      <g opacity={seg(u, 0.45, 0.55)}>
        <rect x={room.x - 60} y={TRACK_Y + 160} width={120} height={14} rx={4} fill={PANEL} stroke={WARM} strokeWidth={1.4} />
        <rect x={room.x - 60} y={TRACK_Y + 160} width={120 * (1 - lease)} height={14} rx={4} fill={WARM} />
        <Label x={room.x} y={TRACK_Y + 200} text="lease runs out" color={WARM} size={18} />
      </g>
      <WarnCard
        x={520}
        y={62}
        w={600}
        title="partition: owner can't reach the bucket"
        lines={['blocked: uploads + epoch reads → no new acks', 'then lease expiry → the owner stops serving']}
        opacity={seg(u, 0.25, 0.4)}
      />
    </g>
  );
}

function Liar({ u, room }: { u: number; room: Pos }) {
  if (u <= 0.001) return null;
  const twin = seg(u, 0.1, 0.3);
  const crowns = seg(u, 0.3, 0.45);
  return (
    <g>
      <g opacity={twin}>
        <Pill x={room.x - 70} y={TRACK_Y - 64} text="A ✓ owner" color={POSITIVE} size={18} opacity={crowns} />
        <Pill x={room.x + 70} y={TRACK_Y - 64} text="B ✓ owner" color={POSITIVE} size={18} opacity={crowns} />
        <Host x={room.x - 140} y={TRACK_Y + 200} label="host A" color={ACCENT} opacity={twin} />
        <Host x={room.x + 140} y={TRACK_Y + 200} label="host B" color={SECONDARY} opacity={twin} />
        <line x1={room.x - 120} y1={TRACK_Y + 160} x2={room.x - 20} y2={TRACK_Y + 40} stroke={ACCENT} strokeWidth={2} opacity={crowns} />
        <line x1={room.x + 120} y1={TRACK_Y + 160} x2={room.x + 20} y2={TRACK_Y + 40} stroke={SECONDARY} strokeWidth={2} opacity={crowns} />
      </g>
      <WarnCard
        x={560}
        y={62}
        w={640}
        title="store ignores conditions: two winners"
        lines={['broken: one owner per room — the foundation', 'no SQLite replay can repair a lying primitive']}
        opacity={seg(u, 0.45, 0.6)}
      />
    </g>
  );
}

function Lifecycle({ u, room }: { u: number; room: Pos }) {
  if (u <= 0.001) return null;
  const sweep = seg(u, 0.15, 0.45);
  const jam = seg(u, 0.5, 0.6);
  const files = ['own.json', 'log/…', 'snapshot/…'];
  const fileX = [770, 880, 1000];
  return (
    <g>
      <Bucket x={900} y={BKT.y} w={260} h={80} label="bucket" />
      {/* recovery path from the bucket back to the room (drawn under the file pills) */}
      <path d={`M ${1030} ${BKT.y} Q ${room.x + 80} ${TRACK_Y + 170} ${room.x + 40} ${TRACK_Y + 92}`} fill="none" stroke={jam > 0.5 ? NEGATIVE : POSITIVE} strokeWidth={2.4} strokeDasharray="7 5" opacity={seg(u, 0.45, 0.55)} />
      {files.map((f, i) => {
        const gone = seg(sweep, i * 0.25, i * 0.25 + 0.4);
        return <Pill key={f} x={fileX[i]} y={BKT.y - 65} text={f} color={gone > 0.5 ? NEGATIVE : TEAL} size={18} mono opacity={1 - 0.75 * gone} />;
      })}
      {/* the rule sits beside the bucket it sweeps, clear of the gate status row */}
      <g opacity={seg(u, 0.05, 0.15)}>
        <Pill x={758} y={BKT.y + 4} text="lifecycle rule: expire after N days" color={NEGATIVE} size={18} anchor="end" fill={colors.BG} />
      </g>
      <WarnCard
        x={860}
        y={62}
        w={640}
        title="lifecycle rule deleted protocol state"
        lines={['broken: retained history + ownership records', 'blocked: recovery — preserve them, never expire']}
        opacity={seg(u, 0.55, 0.7)}
      />
    </g>
  );
}

function Pipeline({ u, stretch, fleet }: { u: number; stretch: number; fleet: number }) {
  if (u <= 0.001) return null;
  const sqlW = 80;
  const rtW = lerp(330, 520, stretch);
  const ownW = 120;
  const draw = clamp01(u);
  const y = PIPE.bar;
  const segs = [
    { w: sqlW, c: POSITIVE, label: 'local SQL' },
    { w: rtW, c: TEAL, label: 'object-store upload round trip' },
    { w: ownW, c: WARM, label: 'ownership check' },
  ];
  let x = PIPE.x0;
  const total = sqlW + rtW + ownW;
  const shown = total * draw;
  const fRt = 210;
  const f = seg(fleet, 0.1, 0.4);
  const cy = PIPE.celldBar;
  return (
    <g>
      {/* lane 1: title · lane 2: not-measured qualification · lane 3: distance badge */}
      <Label x={PIPE.x0} y={PIPE.title} text="workerd bucket-proof path: time until a durable response" color={TEXT} size={18} anchor="start" opacity={draw} />
      <Illus x={PIPE.x0} y={PIPE.note} text="illustrative widths — not measured" opacity={draw} />
      {segs.map((sg) => {
        const x0 = x;
        x += sg.w;
        const vis = clamp01((shown - (x0 - PIPE.x0)) / sg.w);
        if (vis <= 0) return null;
        return (
          <g key={sg.label}>
            <rect x={x0} y={y - PIPE.h / 2} width={sg.w * vis} height={PIPE.h} fill={sg.c} opacity={0.75} />
            <Label x={x0 + sg.w / 2} y={y + PIPE.h / 2 + 26} text={sg.label} color={sg.c} size={18} opacity={vis} />
          </g>
        );
      })}
      <g opacity={stretch}>
        <Pill x={PIPE.x0 + sqlW + rtW / 2} y={PIPE.badge} text="storage far from compute → longer" color={TEAL} size={18} fill={colors.BG} />
      </g>
      {/* failure domain boundary: both paths must cross it */}
      <g opacity={f}>
        <rect x={110} y={PIPE.domainTop} width={PIPE.x0 + sqlW - 110 + 6} height={PIPE.domainBot - PIPE.domainTop} rx={16} fill="none" stroke={NEGATIVE} strokeWidth={2} strokeDasharray="8 6" />
        <Label x={120} y={PIPE.domainBot + 24} text="one failure domain" color={NEGATIVE} size={18} anchor="start" />
        <Label x={PIPE.x0 + sqlW + 16} y={PIPE.celldLabel} text="celld fleet path (explicitly celld)" color={SECONDARY} size={18} anchor="start" />
        <rect x={PIPE.x0} y={cy - PIPE.h / 2} width={sqlW} height={PIPE.h} fill={POSITIVE} opacity={0.75} />
        <rect x={PIPE.x0 + sqlW} y={cy - PIPE.h / 2} width={fRt * seg(fleet, 0.2, 0.5)} height={PIPE.h} fill={SECONDARY} opacity={0.75} />
        <Label x={PIPE.x0 + sqlW + fRt / 2} y={cy + PIPE.h / 2 + 26} text="follower fsync" color={SECONDARY} size={18} opacity={seg(fleet, 0.4, 0.5)} />
        <Pill x={PIPE.x0 + sqlW + fRt + 24} y={cy} text="+ follower disks + recovery work" color={WARM} size={18} anchor="start" opacity={seg(fleet, 0.55, 0.7)} fill={colors.BG} />
      </g>
      <Pill x={640} y={PIPE.noPath} text="no path avoids moving bytes beyond one failure domain" color={TEXT} size={18} opacity={seg(fleet, 0.75, 0.9)} fill={colors.BG} />
    </g>
  );
}

function Alarm({ u, quest, room }: { u: number; quest: number; room: Pos }) {
  if (u <= 0.001) return null;
  const kill = seg(u, 0.35, 0.5);
  const claim = seg(u, 0.5, 0.6);
  const ring = seg(u, 0.75, 0.82);
  const wiggle = ring > 0 && u < 0.98 ? Math.sin(u * 220) * 14 * ring : 0;
  const qs = ['alarm discovery', 'durable scheduling state', 'handler execution', 'external effects'];
  return (
    <g>
      <Host x={360} y={ALARM.host} label="owner A" color={ACCENT} opacity={seg(u, 0, 0.1)} dead={kill} />
      <Host x={920} y={ALARM.host} label="survivor B" color={SECONDARY} opacity={seg(u, 0, 0.1)} />
      {/* bell rides with the room */}
      <g transform={`translate(${room.x + 58}, ${room.y - 42}) rotate(${wiggle})`} opacity={seg(u, 0.05, 0.15)}>
        <path d="M -14 8 Q -14 -14 0 -16 Q 14 -14 14 8 L 18 13 L -18 13 Z" fill={ring > 0.5 ? WARM : MUTED} />
        <circle cx={0} cy={17} r={4} fill={ring > 0.5 ? WARM : MUTED} />
      </g>
      {/* one narration lane at y=205: SQLite state → claim → alarm runs (sequential) */}
      <Pill x={640} y={ALARM.lane} text="alarm deadline stays in the object's SQLite state" color={MUTED} size={18} opacity={seg(u, 0.1, 0.25) * (1 - seg(u, 0.45, 0.5))} fill={colors.BG} />
      <Pill x={640} y={ALARM.lane} text="survivor claims ownership → alarm follows the claim" color={SECONDARY} size={18} opacity={claim * (1 - seg(u, 0.7, 0.75))} fill={colors.BG} />
      <Pill x={920} y={ALARM.lane} text="alarm runs on survivor" color={WARM} size={18} opacity={ring} fill={colors.BG} />
      <g opacity={seg(u, 0.85, 1)}>
        <Pill x={ALARM.badgeX} y={ALARM.badge1} text="ad78a8f · Oct 31: tested (owner, killed owner, missing node record)" color={POSITIVE} size={18} anchor="start" fill={colors.BG} />
        <Pill x={ALARM.badgeX} y={ALARM.badge2} text="aa49479 · Oct 29 initial merge: no alarms" color={MUTED} size={18} anchor="start" fill={colors.BG} />
      </g>
      <g opacity={quest}>
        <rect x={180} y={ALARM.panel} width={920} height={84} rx={14} fill={colors.BG} stroke={WARM} strokeWidth={2} />
        <Label x={640} y={ALARM.panel + 26} text="tests ≠ every side effect exactly once — separate questions:" color={WARM} size={18} />
        {qs.map((q, i) => (
          <Pill key={q} x={[290, 529, 776, 984][i]} y={ALARM.panel + 62} text={q} color={TEXT} size={18} opacity={seg(quest, 0.15 + i * 0.15, 0.3 + i * 0.15)} />
        ))}
      </g>
    </g>
  );
}

function Portable({ u, evalU, dated, quiet }: { u: number; evalU: number; dated: number; quiet: number }) {
  if (u <= 0.001) return null;
  const move = seg(u, 0.35, 0.7);
  const bx = lerp(140, 680, ease.move(move));
  const chips = ['network services', 'supported APIs', 'production ops', 'managed services'];
  // the evaluation / dated cards replace the platform box outright (no text-on-text)
  const cover = Math.max(evalU, dated);
  return (
    <g opacity={1 - 0.88 * quiet}>
      {/* managed platform breadth stays where it is */}
      <g opacity={seg(u, 0, 0.15) * (1 - seg(cover, 0, 0.2))}>
        <rect x={140} y={170} width={480} height={330} rx={26} fill={PANEL} stroke={MUTED} strokeWidth={1.6} opacity={0.6} />
        <Label x={380} y={204} text="managed platform breadth" color={MUTED} size={18} bold />
        {chips.map((c, i) => (
          <Pill key={c} x={i % 2 === 0 ? 265 : 495} y={i < 2 ? 420 : 466} text={c} color={MUTED} size={18} />
        ))}
      </g>
      {/* portable boundary relocates */}
      <rect x={bx} y={160} width={500} height={330} rx={22} fill="none" stroke={ACCENT} strokeWidth={2.6} strokeDasharray="10 7" />
      <Label x={bx + 20} y={150} text="where the programming model runs" color={ACCENT} size={18} anchor="start" bold />
      <g opacity={seg(u, 0.65, 0.85)}>
        <Host x={760} y={400} label="your host" color={ACCENT} />
        <Host x={1040} y={400} label="your host" color={ACCENT} />
        <Pill x={900} y={204} text="same identity · same storage model" color={POSITIVE} size={18} />
        <Bucket x={900} y={546} w={220} h={56} label="qualified bucket" />
        <Label x={1190} y={556} text="your ops" color={WARM} size={18} anchor="end" />
      </g>
      <g opacity={evalU}>
        <rect x={140} y={170} width={480} height={330} rx={26} fill={colors.BG} stroke={WARM} strokeWidth={2} />
        <Label x={180} y={272} text="evaluate separately:" color={WARM} size={20} anchor="start" bold />
        {['runtime portability', 'supported APIs', 'network services', 'production operations'].map((r, i) => (
          <g key={r} opacity={seg(evalU, 0.1 + i * 0.15, 0.25 + i * 0.15)}>
            <Label x={190} y={312 + i * 40} text="?" color={WARM} size={20} bold anchor="start" />
            <Label x={216} y={312 + i * 40} text={r} color={TEXT} size={20} anchor="start" />
          </g>
        ))}
      </g>
      <g opacity={dated}>
        <rect x={140} y={170} width={480} height={330} rx={26} fill={colors.BG} stroke={MUTED} strokeWidth={1.6} />
        <Label x={180} y={274} text="stated direction:" color={TEXT} size={18} anchor="start" />
        <Label x={180} y={304} text="first-class self-hosting" color={POSITIVE} size={22} anchor="start" bold />
        <Label x={180} y={350} text="inspected implementation:" color={TEXT} size={18} anchor="start" />
        <Label x={180} y={382} text="aa49479 · 2026-10-29 UTC" color={WARM} size={18} mono anchor="start" />
        <Label x={180} y={410} text="ad78a8f · 2026-10-31" color={WARM} size={18} mono anchor="start" />
        <Label x={180} y={450} text="experimental · dated · not a promise" color={MUTED} size={18} anchor="start" />
      </g>
    </g>
  );
}

function History({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const items = [
    { y: '2020', t: 'coordinated state', c: ACCENT },
    { y: '2022', t: 'open runtime', c: TEAL },
    { y: '2024', t: 'SQLite beside objects', c: WARM },
    { y: 'Aug 2026', t: 'celld operating model', c: SECONDARY },
  ];
  return (
    <g opacity={clamp01(u * 5)}>
      <rect x={110} y={150} width={1060} height={210} rx={18} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
      <line x1={190} y1={250} x2={1090} y2={250} stroke={MUTED} strokeWidth={3} />
      {items.map((it, i) => {
        const x = 220 + i * 280;
        const on = seg(u, 0.1 + i * 0.18, 0.25 + i * 0.18);
        return (
          <g key={it.y} opacity={0.2 + 0.8 * on}>
            <circle cx={x} cy={250} r={10} fill={it.c} />
            <Label x={x} y={222} text={it.y} color={it.c} size={22} bold />
            <Label x={x} y={292} text={it.t} color={TEXT} size={20} />
          </g>
        );
      })}
    </g>
  );
}

function Contract({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const left = ['serialization: conditional writes on one key', 'strong reads', 'durable bytes'];
  const right = ['ownership', 'capture', 'output gates', 'recovery'];
  return (
    <g opacity={clamp01(u * 5)}>
      <rect x={90} y={130} width={1100} height={400} rx={20} fill={colors.BG} stroke={ACCENT} strokeWidth={2} />
      <Label x={360} y={180} text="qualified storage service supplies" color={TEAL} size={22} bold />
      <Label x={920} y={180} text="runtime supplies" color={ACCENT} size={22} bold />
      <line x1={640} y1={160} x2={640} y2={500} stroke={MUTED} strokeWidth={1.4} strokeDasharray="5 6" />
      {left.map((l, i) => (
        <Pill key={l} x={360} y={250 + i * 70} text={l} color={TEAL} size={20} opacity={seg(u, 0.1 + i * 0.12, 0.22 + i * 0.12)} />
      ))}
      {right.map((r, i) => (
        <Pill key={r} x={920} y={240 + i * 66} text={r} color={ACCENT} size={20} opacity={seg(u, 0.45 + i * 0.1, 0.57 + i * 0.1)} />
      ))}
      <Label x={640} y={512} text="each side has a contract" color={MUTED} size={18} opacity={seg(u, 0.85, 1)} />
    </g>
  );
}

/* --------------------------------------------------------------- frame */
export function Render({ s }: { s: SceneState }) {
  const room = s.get(scene.room);
  const part = s.get(scene.partU);
  const lie = s.get(scene.lieU);
  const life = s.get(scene.lifeU);
  const end = s.get(scene.endU);
  const hist = s.get(scene.histU);
  const contract = s.get(scene.contractU);
  const port = s.get(scene.portU);
  const cam = s.get(scene.cam);
  const quiet = Math.max(s.get(scene.quietU), end);
  const fenced = seg(part, 0.85, 0.95);
  const roomColor = seg(lie, 0.15, 0.3) > 0.5 || seg(life, 0.55, 0.6) > 0.5 ? NEGATIVE : ACCENT;
  const roomOp = (1 - 0.88 * Math.max(clamp01(hist * 3), clamp01(contract * 3))) * (1 - end);
  return (
    <>
      <Backdrop />
      <Camera {...cam}>
        <Apertures u={s.get(scene.trackU)} pass={s.get(scene.passU)} room={room} part={part} lie={lie} life={life} cam={cam} />
        <g opacity={seg(part, 0.0, 0.1)}>
          <Bucket x={BKT.x} y={BKT.y} w={240} h={76} label="bucket" />
        </g>
        <Partition u={part} room={room} />
        <Liar u={lie} room={room} />
        <Lifecycle u={life} room={room} />
        <Pipeline u={s.get(scene.pipeU)} stretch={s.get(scene.stretchU)} fleet={s.get(scene.fleetU)} />
        <Portable u={port} evalU={s.get(scene.evalU)} dated={s.get(scene.datedU)} quiet={quiet} />
        <Alarm u={s.get(scene.alarmU)} quest={s.get(scene.questU)} room={room} />
        <RoomToken p={room} color={roomColor} op={roomOp} fenced={fenced} />
        <History u={hist} />
        <Contract u={contract} />
        <Msg x={640} y={196} label="m42 ✓" color={POSITIVE} opacity={end} size={22} />
        <Takeaway
          u={end}
          y={350}
          title="Durable Objects, unbound"
          lines={[
            { text: 'One current authority', color: TEXT },
            { text: 'Acknowledged state has a recovery proof', color: POSITIVE },
          ]}
          foot="workerd aa49479 (2026-10-29 UTC) · ad78a8f (2026-10-31) · celld v0.6.3"
        />
      </Camera>
      {/* screen-space footer: stable above the caption band, never moved by the camera */}
      <Illus x={60} y={612} opacity={1 - end} text="lobby, m42, hosts: illustrative · no measured latencies" />
    </>
  );
}

export const vizScene = () => scene;
