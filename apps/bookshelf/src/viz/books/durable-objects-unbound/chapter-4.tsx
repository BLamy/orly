// A message becomes durable
//
// Sources:
//   workerd src/workerd/server/cluster/capture.rs — VFS observes SQLite WAL writes:
//     32-byte WAL header, then 24-byte frame header + page per frame; the last frame's
//     database-size field marks a committed transaction; unfinished frames are buffered;
//     rollback / checkpoint-reset overwrites are handled; only completed transactions emit.
//   workerd cluster log.rs — merged page batches, gzip, frames.capnp, sequence ranges.
//   workerd src/workerd/server/cluster/owner.rs — Owner::commit groups callers behind a
//     captured target and an ack watermark; Owner::push → stage → put (upload) → re-read
//     Ownership::current_epoch → slot.ack(epoch, round) only on a matching epoch.
//   celld crates/ltx/src/db.rs, crates/celld/ltx_repl.rs, docs/guarantees.md — a
//     DIFFERENT encoding: committed WAL changes → level-zero LTX files with TXID ranges
//     and CRC64 checksums; crates/logic/output_gate.rs gates responses, read-only and
//     error responses, stream chunks and certain side effects that expose uncovered writes.
//
// Machine: an SQLite page grid, a WAL ribbon, a capture press and an output gate. m42
// first gets a premature acknowledgement and is lost with its owner; rewind; the WAL
// ribbon fills with frames, a rolled-back frame never reaches the press, committed
// frames merge into a gzip batch (pages 1, 3, 3 → latest page 3 kept, sequence range
// kept), the batch uploads, the epoch is re-read and only then does the gate open.
// m42–m44, page numbers and sequence numbers are illustrative fixtures.
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
const CLIENT = { x: 1190, y: 140 };
const GATE = { x: 1070, y: 140 };
const HOST = { x: 120, y: 210, w: 740, h: 380 };
const GRID = { x: 170, y: 280, cell: 44, gap: 4, cols: 4, rows: 3 };
const WAL = { x: 170, y: 500, hdrW: 96, fW: 104, h: 62 };
const PRESS = { x: 790, y: 500 };
const TRAY = { x: 470, y: 330 };
const BKT = { x: 1090, y: 510 };
const OWN = { x: 1070, y: 300 };

/** WAL fixture (illustrative pages): tx1 = p1, p3*; tx2 = p5 (rolled back); tx3 = p3*. */
const FRAMES = [
  { page: 1, tx: 1, commit: false, rolled: false },
  { page: 3, tx: 1, commit: true, rolled: false },
  { page: 5, tx: 2, commit: false, rolled: true },
  { page: 3, tx: 3, commit: true, rolled: false },
] as const;
const frameX = (i: number) => WAL.x + WAL.hdrW + 8 + i * (WAL.fW + 6);
/** Merge of committed frames: pages 1, 3, 3 → run keeps page 1 and the latest page 3. */
const COMMITTED = FRAMES.map((f, i) => ({ ...f, i })).filter((f) => !f.rolled);
const MERGED = [
  { page: 1, from: 0 },
  { page: 3, from: 3 },
];

/** Response tickets waiting at the gate (group commit). target = sequence each needs. */
const TICKETS = [
  { id: 'm42', target: 2 },
  { id: 'm43', target: 3 },
  { id: 'm44', target: 5 },
] as const;

const CAM_ROOM: CameraState = { x: 500, y: 330, k: 1.15 };
const CAM_WAL: CameraState = { x: 470, y: 470, k: 1.4 };
const CAM_TRAY: CameraState = { x: 600, y: 420, k: 1.25 };
const CAM_CELLD: CameraState = { x: 820, y: 420, k: 1.15 };
const CAM_GATE: CameraState = { x: 960, y: 220, k: 1.4 };
const CAM_ESC: CameraState = { x: 860, y: 260, k: 1.2 };

/* ---------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stageU = tl.channel('stageU', 0);
  const arriveU = tl.channel('arriveU', 0); // m42 arrives, SQL updates pages locally
  const earlyU = tl.channel('earlyU', 0); // premature ack flies to the client
  const killU = tl.channel('killU', 0); // owner dies (naive run)
  const lostU = tl.channel('lostU', 0); // "acknowledged but lost"
  const gateU = tl.channel('gateU', 0); // gate moved to the far side
  const walU = tl.channel('walU', 0); // frames appear in the WAL
  const frameU = tl.channel('frameU', 0); // header / commit-marker spotlight
  const rollU = tl.channel('rollU', 0); // rolled-back frame never captured
  const mergeU = tl.channel('mergeU', 0); // committed frames merge into a batch
  const celldU = tl.channel('celldU', 0); // distinct celld rail (beat 8 only)
  const uploadU = tl.channel('uploadU', 0); // upload → epoch re-read → gate opens
  const groupU = tl.channel('groupU', 0); // group commit tickets
  const kill2U = tl.channel('kill2U', 0); // owner dies after the gate opened
  const escU = tl.channel('escU', 0); // observation escape paths
  const cgateU = tl.channel('cgateU', 0); // celld output gate scope
  const retryU = tl.channel('retryU', 0); // lost reply / retry ambiguity
  const endU = tl.channel('endU', 0);

  // 1 — m42 updates SQLite locally
  tl.caption({ at: 0.5, dur: 10, text: 'Our room accepts message forty-two and updates its SQLite database. Because the database runs beside the object, the SQL work can be local even though preserving its result is distributed work.' });
  tl.tween(stageU, 1, { at: B(1) + 0.2, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_ROOM, { at: B(1) + 4.2, dur: 1.4, ease: ease.move });
  tl.tween(arriveU, 1, { at: B(1) + 1.6, dur: 6.0, ease: ease.linear });

  // 2 — reply immediately, then lose the machine
  tl.caption({ at: 11.5, dur: 10, text: 'If we reply immediately and then lose that machine, the client may believe the message is safe while the only copy vanished with the owner. A local commit is not our final durability proof.' });
  tl.tween(cam, CAMERA_HOME, { at: B(2) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(earlyU, 1, { at: B(2) + 1.0, dur: 3.0, ease: ease.move });
  tl.tween(killU, 1, { at: B(2) + 5.0, dur: 2.0, ease: ease.move });

  // 3 — watch it disappear; move the gate
  tl.caption({ at: 22.5, dur: 10, text: 'Watch the message disappear after that premature acknowledgement. We must move the acknowledgement gate to the far side of the work that makes the message recoverable.' });
  tl.tween(lostU, 1, { at: B(3) + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(lostU, 0, { at: B(3) + 5.6, dur: 0.8, ease: ease.move });
  tl.tween(gateU, 1, { at: B(3) + 6.0, dur: 2.2, ease: ease.move });

  // 4 — rewind; the WAL records changed pages; the main file waits for checkpoint
  tl.caption({ at: 33.5, dur: 10, text: 'SQLite first records changed pages in its write-ahead log. The main database file does not have to be rewritten for every transaction; checkpointing can copy those changes into it later.' });
  tl.tween(killU, 0, { at: B(4) + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(earlyU, 0, { at: B(4) + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WAL, { at: B(4) + 1.0, dur: 1.5, ease: ease.move });
  tl.tween(walU, 1, { at: B(4) + 2.0, dur: 6.0, ease: ease.linear });

  // 5 — capture: header + page frames; database-size marks commit
  tl.caption({ at: 44.5, dur: 10, text: "In workerd, the capture layer observes writes to that log. A frame contains a header and a database page, and the last frame's database-size field marks a completed transaction." });
  tl.tween(frameU, 1, { at: B(5) + 0.6, dur: 8.0, ease: ease.linear });

  // 6 — buffer unfinished frames; rollback never becomes an ack
  tl.caption({ at: 55.5, dur: 10, text: 'The capture buffers unfinished frames. A transaction that rolls back must not become an acknowledged database change merely because some of its bytes appeared in the log.' });
  tl.tween(rollU, 1, { at: B(6) + 0.6, dur: 8.0, ease: ease.linear });

  // 7 — ordered page log, merged compressed batches with sequence info
  tl.caption({ at: 66.5, dur: 10, text: 'Completed transactions become an ordered page log for the object. Workerd merges captured page changes into compressed batches, while preserving the sequence information needed to replay them correctly.' });
  tl.tween(cam, CAM_TRAY, { at: B(7) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(mergeU, 1, { at: B(7) + 1.0, dur: 8.0, ease: ease.linear });

  // 8 — celld's different encoding rail
  tl.caption({ at: 77.5, dur: 10, text: "Celld has a related but different path: it captures committed SQLite log changes into LTX files, with transaction positions and checksums. Workerd's inspected cluster path uses its own frame format." });
  tl.tween(cam, CAM_CELLD, { at: B(8) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(celldU, 1, { at: B(8) + 1.0, dur: 2.0, ease: ease.enter });
  tl.tween(celldU, 0, { at: B(8) + 9.4, dur: 0.6, ease: ease.move });

  // 9 — upload, re-read epoch, advance the watermark
  tl.caption({ at: 88.5, dur: 10, text: 'Workerd uploads the captured batch to the bucket. Then it reads the ownership epoch again; only a matching epoch lets it advance the acknowledgement watermark for waiting operations.' });
  tl.tween(cam, CAMERA_HOME, { at: B(9) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(uploadU, 1, { at: B(9) + 1.0, dur: 8.4, ease: ease.linear });

  // 10 — group commit: each waits for coverage of its own target
  tl.caption({ at: 99.5, dur: 10, text: 'Several operations can share one upload. Each waits for a watermark covering its own captured target, so batching can reduce storage requests without allowing an uncovered response to slip through.' });
  tl.tween(cam, CAM_GATE, { at: B(10) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(groupU, 1, { at: B(10) + 1.2, dur: 8.0, ease: ease.linear });

  // 11 — kill the owner after the gate opens; successor restores
  tl.caption({ at: 110.5, dur: 10, text: 'Now kill the owner after the gate opens. The local database can disappear, but the acknowledged message has a bucket-backed history that the successor can restore.' });
  tl.tween(cam, CAMERA_HOME, { at: B(11) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(kill2U, 1, { at: B(11) + 1.0, dur: 8.0, ease: ease.linear });

  // 12 — observation escape paths
  tl.caption({ at: 121.5, dur: 10, text: "The gate matters for observations too. A response, stream chunk, or external effect can reveal a new value before a normal write reply does; those escape paths need the runtime's durability rules." });
  tl.tween(cam, CAM_ESC, { at: B(12) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(escU, 1, { at: B(12) + 1.0, dur: 8.0, ease: ease.linear });

  // 13 — celld gates read-only and error responses too
  tl.caption({ at: 132.5, dur: 10, text: 'Celld explicitly gates outputs that expose uncovered writes, including read-only and error responses. This is stronger than asking application authors to remember a final flush in every happy path.' });
  tl.tween(cgateU, 1, { at: B(13) + 0.6, dur: 7.0, ease: ease.linear });

  // 14 — lost reply: durability is not exactly-once
  tl.caption({ at: 143.5, dur: 10, text: 'A lost reply still leaves uncertainty for the caller: the write may have committed. Durability preserves acknowledged state; it does not make arbitrary retried application effects happen exactly once.' });
  tl.tween(cgateU, 0, { at: B(14), dur: 0.6, ease: ease.move });
  tl.tween(escU, 0, { at: B(14), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(14) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(retryU, 1, { at: B(14) + 0.8, dur: 4.6, ease: ease.linear });
  tl.tween(endU, 1, { at: B(14) + 5.8, dur: 1.2, ease: ease.enter });
  tl.hold(153.5, 0.5);

  return {
    tl, cam, stageU, arriveU, earlyU, killU, lostU, gateU, walU, frameU, rollU, mergeU, celldU, uploadU,
    groupU, kill2U, escU, cgateU, retryU, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------- derived (closed form) */
/** Ack watermark (sequence covered) — advances only after upload + epoch match. */
function watermark(upload: number): number {
  return seg(upload, 0.78, 0.9) * 3; // the batch covers seq 1–3
}

/* ------------------------------------------------------ subcomponents */

function PageGrid({ arrive, wal, kill }: { arrive: number; wal: number; kill: number }) {
  const touched = (p: number) => (p === 1 || p === 3 ? seg(arrive, 0.45, 0.65) : 0);
  // once the WAL is shown, the main-file pages return to "unchanged"
  const mainLit = 1 - seg(wal, 0.05, 0.2);
  return (
    <g opacity={1 - kill}>
      {Array.from({ length: GRID.cols * GRID.rows }, (_, i) => {
        const c = i % GRID.cols;
        const r = Math.floor(i / GRID.cols);
        const page = i + 1;
        const x = GRID.x + c * (GRID.cell + GRID.gap);
        const y = GRID.y + r * (GRID.cell + GRID.gap);
        const lit = touched(page) * mainLit;
        return (
          <g key={i}>
            <rect x={x} y={y} width={GRID.cell} height={GRID.cell} rx={5} fill={lit > 0.01 ? WARM : PANEL} fillOpacity={0.25 + 0.6 * lit} stroke={WARM} strokeWidth={1.4} />
            <text x={x + GRID.cell / 2} y={y + GRID.cell / 2 + 6} textAnchor="middle" fill={TEXT} fontSize={18} fontFamily={MONO}>
              {page}
            </text>
          </g>
        );
      })}
      <Label x={GRID.x} y={GRID.y - 14} text={wal > 0.1 ? 'main DB file — unchanged until checkpoint' : 'SQLite database'} color={wal > 0.1 ? MUTED : WARM} size={18} anchor="start" />
    </g>
  );
}

function WalRibbon({ wal, frame, roll, merge, kill }: { wal: number; frame: number; roll: number; merge: number; kill: number }) {
  if (wal <= 0.001) return null;
  const hdr = seg(frame, 0.05, 0.3);
  const commitSpot = seg(frame, 0.45, 0.65);
  return (
    <g opacity={1 - kill}>
      <Label x={WAL.x} y={WAL.y - 16} text="write-ahead log (WAL)" color={ACCENT} size={18} anchor="start" bold />
      {/* 32-byte WAL header */}
      <g opacity={seg(wal, 0, 0.1)}>
        <rect x={WAL.x} y={WAL.y} width={WAL.hdrW} height={WAL.h} rx={6} fill={PANEL} stroke={ACCENT} strokeWidth={1.6 + 1.4 * hdr} />
        <text x={WAL.x + WAL.hdrW / 2} y={WAL.y + 26} textAnchor="middle" fill={ACCENT} fontSize={18} fontFamily={MONO}>WAL hdr</text>
        <text x={WAL.x + WAL.hdrW / 2} y={WAL.y + 50} textAnchor="middle" fill={MUTED} fontSize={16} fontFamily={MONO}>32 B</text>
      </g>
      {FRAMES.map((f, i) => {
        const appear = seg(wal, 0.15 + i * 0.2, 0.3 + i * 0.2);
        if (appear <= 0) return null;
        const x = frameX(i);
        const rolledFade = f.rolled ? seg(roll, 0.55, 0.8) : 0;
        const lifted = f.rolled ? 0 : seg(merge, 0.05 + COMMITTED.findIndex((c) => c.i === i) * 0.1, 0.3 + COMMITTED.findIndex((c) => c.i === i) * 0.1);
        const isCommit = f.commit;
        const stroke = f.rolled && roll > 0.2 ? NEGATIVE : isCommit ? POSITIVE : ACCENT;
        return (
          <g key={i} opacity={appear * (1 - 0.85 * rolledFade) * (1 - 0.7 * lifted)}>
            <rect x={x} y={WAL.y} width={WAL.fW} height={WAL.h} rx={6} fill={PANEL} stroke={stroke} strokeWidth={2} strokeDasharray={f.rolled && roll > 0.2 ? '5 4' : undefined} />
            <rect x={x} y={WAL.y} width={WAL.fW} height={22} rx={6} fill={ACCENT} opacity={0.15 + 0.35 * hdr} />
            <text x={x + WAL.fW / 2} y={WAL.y + 17} textAnchor="middle" fill={TEXT} fontSize={16} fontFamily={MONO}>hdr 24 B</text>
            <text x={x + WAL.fW / 2} y={WAL.y + 48} textAnchor="middle" fill={WARM} fontSize={18} fontFamily={MONO}>{`page ${f.page}`}</text>
            {isCommit ? (
              <g opacity={commitSpot}>
                <circle cx={x + WAL.fW - 10} cy={WAL.y + 11} r={7} fill={POSITIVE} />
              </g>
            ) : null}
            <Label x={x + WAL.fW / 2} y={WAL.y + WAL.h + 24} text={`tx${f.tx}`} color={f.rolled ? NEGATIVE : MUTED} size={16} opacity={seg(frame, 0.7, 0.85)} />
          </g>
        );
      })}
      <g opacity={hdr * (1 - commitSpot)}>
        <Pill x={WAL.x + 290} y={WAL.y - 52} text="frame = 24-byte header + one page" color={ACCENT} size={18} />
      </g>
      <g opacity={commitSpot * (1 - seg(roll, 0, 0.1))}>
        <Pill x={WAL.x + 300} y={WAL.y - 52} text="db-size field ≠ 0 → transaction committed" color={POSITIVE} size={18} />
      </g>
      <g opacity={seg(roll, 0.2, 0.4) * (1 - seg(merge, 0, 0.1))}>
        <Pill x={frameX(2) + WAL.fW / 2} y={WAL.y - 52} text="tx2 rolled back → buffered, never emitted" color={NEGATIVE} size={18} fill={colors.BG} />
      </g>
    </g>
  );
}

function Press({ wal, roll, merge, kill }: { wal: number; roll: number; merge: number; kill: number }) {
  if (wal <= 0.001) return null;
  const stamp = Math.max(seg(roll, 0.2, 0.3) * (1 - seg(roll, 0.35, 0.45)), seg(merge, 0.4, 0.5) * (1 - seg(merge, 0.55, 0.65)));
  return (
    <g opacity={seg(wal, 0, 0.15) * (1 - kill)}>
      <rect x={PRESS.x - 42} y={PRESS.y - 92 + 30 * stamp} width={84} height={56} rx={6} fill={PANEL} stroke={TEAL} strokeWidth={2.4} />
      <rect x={PRESS.x - 10} y={PRESS.y - 140} width={20} height={48 + 30 * stamp} fill={TEAL} opacity={0.6} />
      <rect x={PRESS.x - 52} y={PRESS.y + 4} width={104} height={54} rx={6} fill="none" stroke={TEAL} strokeWidth={1.6} strokeDasharray="5 4" />
      <Label x={PRESS.x} y={PRESS.y + 84} text="capture" color={TEAL} size={18} bold />
    </g>
  );
}

function MergeTray({ merge, upload }: { merge: number; upload: number }) {
  if (merge <= 0.001) return null;
  const gather = seg(merge, 0.05, 0.4);
  const fold = seg(merge, 0.5, 0.7);
  const pack = seg(merge, 0.8, 0.95);
  const fly = seg(upload, 0.05, 0.4);
  const bx = lerp(TRAY.x + 120, BKT.x, ease.move(fly));
  const by = lerp(TRAY.y + 90, BKT.y - 40, ease.move(fly));
  return (
    <g>
      <g opacity={1 - pack}>
        <rect x={TRAY.x - 40} y={TRAY.y - 44} width={400} height={120} rx={12} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
        <Label x={TRAY.x - 24} y={TRAY.y - 18} text="ordered page log" color={MUTED} size={18} anchor="start" />
        {COMMITTED.map((c, k) => {
          const u = seg(gather, k * 0.25, k * 0.25 + 0.5);
          const x0 = frameX(c.i) + WAL.fW / 2;
          const x1 = TRAY.x + k * 100;
          // the two page-3 frames fold into one (latest wins)
          const xf = c.page === 3 ? lerp(x1, TRAY.x + 150, fold) : lerp(x1, TRAY.x + 30, fold);
          const op = c.page === 3 && k === 1 ? 1 - fold : 1;
          return (
            <g key={k} opacity={op * clamp01(u * 3)}>
              <rect x={lerp(x0, xf, u) - 40} y={lerp(WAL.y, TRAY.y, u)} width={80} height={44} rx={6} fill={PANEL} stroke={c.commit ? POSITIVE : ACCENT} strokeWidth={2} />
              <text x={lerp(x0, xf, u)} y={lerp(WAL.y, TRAY.y, u) + 29} textAnchor="middle" fill={WARM} fontSize={18} fontFamily={MONO}>{`p${c.page}`}</text>
            </g>
          );
        })}
        <g opacity={seg(gather, 0.8, 1) * (1 - fold)}>
          <line x1={TRAY.x + 150} y1={TRAY.y - 4} x2={TRAY.x + 150} y2={TRAY.y + 52} stroke={MUTED} strokeWidth={2} strokeDasharray="3 3" />
          <Label x={TRAY.x + 50} y={TRAY.y + 70} text="tx1" color={MUTED} size={16} />
          <Label x={TRAY.x + 200} y={TRAY.y + 70} text="tx3" color={MUTED} size={16} />
        </g>
        <Label x={TRAY.x + 260} y={TRAY.y + 30} text="latest p3 kept" color={WARM} size={18} anchor="start" opacity={fold} />
        <Label x={TRAY.x + 90} y={TRAY.y + 70} text="covers seq 1–3" color={TEXT} size={16} opacity={fold} />
      </g>
      {pack > 0.001 && fly < 1 ? (
        <g transform={`translate(${bx}, ${by})`} opacity={pack}>
          <rect x={-110} y={-24} width={220} height={48} rx={10} fill={PANEL} stroke={TEAL} strokeWidth={2.4} />
          <text y={-2} textAnchor="middle" fill={TEAL} fontSize={18} fontFamily={MONO}>frames.capnp · gzip</text>
          <text y={18} textAnchor="middle" fill={MUTED} fontSize={14} fontFamily={MONO}>seq 1–3 · p1, p3</text>
        </g>
      ) : null}
    </g>
  );
}

function CelldRail({ u }: { u: number }) {
  if (u <= 0.001) return null;
  return (
    <g opacity={u}>
      <rect x={880} y={300} width={360} height={150} rx={14} fill={colors.BG} stroke={SECONDARY} strokeWidth={2.2} />
      <Label x={900} y={330} text="celld — a different path" color={SECONDARY} size={20} anchor="start" bold />
      <Label x={900} y={362} text="committed WAL → L0 LTX" color={TEXT} size={18} mono anchor="start" />
      <Label x={900} y={392} text="TXID ranges · CRC64" color={TEXT} size={18} mono anchor="start" />
      <Label x={900} y={428} text="not workerd's encoding" color={MUTED} size={16} anchor="start" />
      <Pill x={TRAY.x + 160} y={TRAY.y - 70} text="workerd: own frame format (frames.capnp)" color={TEAL} size={18} fill={colors.BG} />
    </g>
  );
}

function OwnCheck({ upload, kill2 }: { upload: number; kill2: number }) {
  const read = seg(upload, 0.45, 0.65);
  const ok = seg(upload, 0.65, 0.75);
  if (upload < 0.4) return null;
  return (
    <g opacity={1 - seg(kill2, 0.0, 0.1)}>
      <rect x={OWN.x - 120} y={OWN.y - 26} width={240} height={52} rx={10} fill={colors.BG} stroke={ok > 0.5 ? POSITIVE : WARM} strokeWidth={2.2} />
      <text x={OWN.x} y={OWN.y + 7} textAnchor="middle" fill={ok > 0.5 ? POSITIVE : WARM} fontSize={18} fontFamily={MONO}>
        {ok > 0.5 ? 'epoch 7 = 7 ✓' : 'read own.json…'}
      </text>
      {read > 0 && read < 1 ? <circle cx={OWN.x} cy={lerp(BKT.y - 60, OWN.y + 26, read)} r={7} fill={WARM} /> : null}
      <Label x={OWN.x} y={OWN.y - 38} text="fresh epoch read" color={MUTED} size={16} />
    </g>
  );
}

function Gate({ u, open, bad }: { u: number; open: number; bad: number }) {
  if (u <= 0.001) return null;
  const x = lerp(560, GATE.x, ease.move(clamp01(u)));
  return (
    <g transform={`translate(${x}, ${GATE.y})`}>
      <rect x={-8} y={-60} width={16} height={120} rx={4} fill={MUTED} />
      <rect x={-8} y={-60} width={16} height={120 * (1 - open)} rx={4} fill={bad > 0.5 ? NEGATIVE : WARM} />
      <Label x={0} y={-72} text={open > 0.5 ? 'gate open' : 'ack gate'} color={open > 0.5 ? POSITIVE : WARM} size={18} bold />
    </g>
  );
}

function Tickets({ upload, group, kill2 }: { upload: number; group: number; kill2: number }) {
  const show = Math.max(seg(upload, 0.0, 0.1), group > 0 ? 1 : 0);
  if (show <= 0.001) return null;
  const wm = watermark(upload);
  return (
    <g opacity={show * (1 - 0.85 * seg(kill2, 0.0, 0.1))}>
      {TICKETS.map((tk, i) => {
        if (i > 0 && group <= 0.001) return null;
        const appear = i === 0 ? 1 : seg(group, (i - 1) * 0.12, (i - 1) * 0.12 + 0.12);
        const covered = wm >= tk.target;
        const release = covered ? (i === 0 ? seg(upload, 0.85, 1) : seg(group, 0.4 + i * 0.1, 0.55 + i * 0.1)) : 0;
        const x = lerp(900 - i * 56, CLIENT.x, ease.move(release));
        return (
          <g key={tk.id} opacity={appear * (1 - 0.5 * release)}>
            <Msg x={x} y={GATE.y + (i - 1) * 40} label={tk.id} color={covered ? POSITIVE : WARM} />
            <Label x={x - 50} y={GATE.y + (i - 1) * 40 + 6} text={`≤${tk.target}`} color={MUTED} size={16} anchor="end" opacity={1 - release} />
          </g>
        );
      })}
      <g opacity={seg(group, 0.2, 0.35)}>
        <Pill x={940} y={GATE.y + 110} text={`ack watermark: seq ${Math.round(wm)}`} color={POSITIVE} size={18} mono fill={colors.BG} />
        <Label x={760} y={GATE.y + 46} text="m44 needs seq 5 — waits" color={WARM} size={18} opacity={seg(group, 0.75, 0.9)} />
      </g>
    </g>
  );
}

function NaiveLoss({ early, kill, lost }: { early: number; kill: number; lost: number }) {
  return (
    <g>
      {early > 0.001 && early < 1 ? (
        <Msg x={lerp(380, CLIENT.x - 40, ease.move(early))} y={lerp(320, CLIENT.y, ease.move(early))} label="ack m42" color={WARM} />
      ) : null}
      {early >= 1 ? <Pill x={CLIENT.x - 30} y={CLIENT.y + 54} text="✓ saved?" color={WARM} size={18} anchor="end" opacity={1} /> : null}
      <WarnCard
        x={640}
        y={60}
        w={560}
        title="acknowledged but lost"
        lines={['the client holds an ack; no copy of m42 exists', 'invariant broken: ack ⇒ recoverable']}
        opacity={lost}
      />
    </g>
  );
}

function Escapes({ u, cgate }: { u: number; cgate: number }) {
  if (u <= 0.001) return null;
  const paths = [
    { id: 'response', y: GATE.y - 40 },
    { id: 'stream chunk', y: GATE.y },
    { id: 'external effect', y: GATE.y + 40 },
  ];
  const bypass = seg(u, 0.3, 0.55);
  const reroute = seg(u, 0.65, 0.85);
  return (
    <g opacity={clamp01(u * 6)}>
      {paths.map((p, i) => (
        <g key={p.id} opacity={seg(u, i * 0.08, i * 0.08 + 0.1)}>
          <line x1={760} y1={p.y} x2={GATE.x - 12} y2={p.y} stroke={ACCENT} strokeWidth={2.4} />
          <Pill x={760} y={p.y} text={p.id} color={ACCENT} size={18} anchor="end" fill={colors.BG} />
        </g>
      ))}
      {/* a stream chunk tries to go around the gate */}
      <path d={`M ${GATE.x - 40} ${GATE.y} C ${GATE.x - 20} ${GATE.y - 120}, ${GATE.x + 40} ${GATE.y - 120}, ${CLIENT.x - 30} ${CLIENT.y - 20}`} fill="none" stroke={NEGATIVE} strokeWidth={3} strokeDasharray="8 6" opacity={bypass * (1 - reroute)} />
      <Pill x={GATE.x} y={GATE.y - 112} text="escape path: reveals uncovered value" color={NEGATIVE} size={18} fill={colors.BG} opacity={bypass * (1 - reroute)} />
      <Pill x={GATE.x - 120} y={GATE.y + 110} text="every observation waits for the gate" color={POSITIVE} size={18} fill={colors.BG} opacity={reroute * (1 - cgate)} />
    </g>
  );
}

function CelldGate({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const rows = ['responses', 'read-only responses', 'error responses', 'stream chunks', 'certain side effects'];
  return (
    <g opacity={clamp01(u * 5)}>
      <rect x={300} y={240} width={460} height={290} rx={14} fill={colors.BG} stroke={SECONDARY} strokeWidth={2.2} />
      <Label x={320} y={272} text="celld output gate holds, when they" color={SECONDARY} size={18} anchor="start" bold />
      <Label x={320} y={298} text="expose uncovered writes:" color={SECONDARY} size={18} anchor="start" bold />
      {rows.map((r, i) => (
        <g key={r} opacity={seg(u, 0.1 + i * 0.1, 0.2 + i * 0.1)}>
          <circle cx={334} cy={330 + i * 32} r={5} fill={SECONDARY} />
          <Label x={350} y={336 + i * 32} text={r} color={TEXT} size={18} anchor="start" />
        </g>
      ))}
      <Label x={530} y={508} text="not: “remember a final flush”" color={WARM} size={18} opacity={seg(u, 0.7, 0.85)} />
    </g>
  );
}

function Retry({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const fly = seg(u, 0.05, 0.35);
  const lostMark = seg(u, 0.3, 0.4);
  const retry = seg(u, 0.5, 0.8);
  return (
    <g>
      {fly < 1 && fly > 0 ? <Msg x={lerp(GATE.x + 10, CLIENT.x - 60, fly)} y={GATE.y - 70} label="ack m42" color={POSITIVE} /> : null}
      <g opacity={lostMark}>
        <Label x={CLIENT.x - 70} y={GATE.y - 60} text="✗" color={NEGATIVE} size={34} bold />
        <Pill x={CLIENT.x} y={GATE.y + 80} text="committed?" color={WARM} size={18} anchor="end" />
      </g>
      <g opacity={retry}>
        <path d={`M ${CLIENT.x - 20} ${CLIENT.y + 100} Q ${CLIENT.x - 140} ${CLIENT.y + 150} ${GATE.x - 200} ${CLIENT.y + 60}`} fill="none" stroke={WARM} strokeWidth={2.4} strokeDasharray="7 5" />
        <Pill x={GATE.x - 240} y={CLIENT.y + 140} text="retry → effect may repeat" color={WARM} size={18} fill={colors.BG} />
      </g>
    </g>
  );
}

/* --------------------------------------------------------------- frame */
export function Render({ s }: { s: SceneState }) {
  const stage = s.get(scene.stageU);
  const arrive = s.get(scene.arriveU);
  const kill = s.get(scene.killU);
  const wal = s.get(scene.walU);
  const frame = s.get(scene.frameU);
  const roll = s.get(scene.rollU);
  const merge = s.get(scene.mergeU);
  const upload = s.get(scene.uploadU);
  const group = s.get(scene.groupU);
  const kill2 = s.get(scene.kill2U);
  const esc = s.get(scene.escU);
  const cgate = s.get(scene.cgateU);
  const end = s.get(scene.endU);
  const gateOpen = Math.max(seg(upload, 0.76, 0.84) * (1 - seg(upload, 0.95, 1)), seg(group, 0.4, 0.5) * (1 - seg(group, 0.8, 0.9)), seg(s.get(scene.retryU), 0, 0.05) * (1 - seg(s.get(scene.retryU), 0.3, 0.35)));
  const dead = Math.max(kill, seg(kill2, 0.1, 0.35));
  const restore = seg(kill2, 0.45, 0.85);
  const base = 1 - 0.9 * end;
  const hostFocus = 1 - 0.8 * clamp01(esc * 4);
  // m42 request travel
  const reqU = seg(arrive, 0, 0.4);
  return (
    <>
      <Backdrop />
      <Camera {...s.get(scene.cam)}>
        <g opacity={stage * base}>
          {/* owner host boundary */}
          <g opacity={hostFocus}>
            <rect x={HOST.x} y={HOST.y} width={HOST.w} height={HOST.h} rx={18} fill="none" stroke={dead > 0.5 ? NEGATIVE : ACCENT} strokeWidth={2} strokeDasharray={dead > 0.5 ? '8 6' : undefined} />
            <Label x={HOST.x + 18} y={HOST.y - 12} text="owner A · room lobby (epoch 7)" color={ACCENT} size={18} anchor="start" bold />
            <PageGrid arrive={arrive} wal={wal} kill={dead} />
            <WalRibbon wal={wal} frame={frame} roll={roll} merge={merge} kill={dead} />
            <Press wal={wal} roll={roll} merge={merge} kill={dead} />
            <g opacity={1 - dead}>
              <MergeTray merge={merge} upload={upload} />
              <Pill x={560} y={268} text="SQL: local library call" color={POSITIVE} size={18} opacity={seg(arrive, 0.55, 0.75) * (1 - seg(wal, 0, 0.1))} />
            </g>
            {dead > 0.01 ? (
              <g opacity={dead} stroke={NEGATIVE} strokeWidth={6} strokeLinecap="round">
                <line x1={HOST.x + 290} y1={HOST.y + 110} x2={HOST.x + 450} y2={HOST.y + 270} />
                <line x1={HOST.x + 450} y1={HOST.y + 110} x2={HOST.x + 290} y2={HOST.y + 270} />
              </g>
            ) : null}
            {/* successor restores from the bucket (beat 11) */}
            <g opacity={restore * (1 - 0.85 * seg(esc, 0, 0.1))}>
              <Host x={960} y={380} label="successor" color={POSITIVE} />
              <path d={`M ${BKT.x - 90} ${BKT.y} Q 980 ${BKT.y} 965 452`} fill="none" stroke={POSITIVE} strokeWidth={2.4} strokeDasharray="7 5" />
              <Pill x={820} y={578} text="restore from bucket history" color={POSITIVE} size={18} fill={colors.BG} />
              <Msg x={960} y={312} label="m42" color={POSITIVE} />
            </g>
          </g>
          {/* client + m42 request */}
          <circle cx={CLIENT.x} cy={CLIENT.y} r={20} fill={PANEL} stroke={TEXT} strokeWidth={2} />
          <Label x={CLIENT.x} y={CLIENT.y - 32} text="client" color={TEXT} size={18} />
          {reqU > 0 && reqU < 1 ? <Msg x={lerp(CLIENT.x - 30, GRID.x + 100, ease.move(reqU))} y={lerp(CLIENT.y, GRID.y + 60, ease.move(reqU))} label="m42" /> : null}
          <Bucket x={BKT.x} y={BKT.y} w={180} h={92} label="bucket" opacity={seg(wal, 0, 0.2)} />
          {upload > 0.3 ? <Label x={BKT.x} y={BKT.y + 74} text="log/…" color={TEAL} size={18} mono opacity={seg(upload, 0.35, 0.45)} /> : null}
          <OwnCheck upload={upload} kill2={kill2} />
          <Gate u={s.get(scene.gateU)} open={gateOpen} bad={0} />
          <Tickets upload={upload} group={group} kill2={kill2} />
          <NaiveLoss early={s.get(scene.earlyU)} kill={kill} lost={s.get(scene.lostU)} />
          <CelldRail u={s.get(scene.celldU)} />
          <Escapes u={esc} cgate={cgate} />
          <CelldGate u={cgate} />
          <Retry u={s.get(scene.retryU)} />
          <Illus x={60} y={612} text="m42–m44, pages, sequence numbers: illustrative" />
        </g>
        <Takeaway
          u={end}
          y={320}
          title="m42 is durable"
          lines={[
            { text: 'captured frames → frames.capnp batch → bucket ✓', color: TEAL },
            { text: 'fresh epoch read: 7 = 7 ✓ → slot.ack(epoch, round)', color: POSITIVE, mono: true },
            { text: 'only then: the acknowledgement leaves the gate', color: TEXT },
            { text: 'a lost reply is still ambiguous — not exactly-once', color: WARM },
          ]}
          foot="workerd bucket-proof path"
        />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
