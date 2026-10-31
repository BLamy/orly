// Rebuild the room, prove the tail
//
// Sources:
//   workerd cluster log.rs — restore / plan / check_gaps / Replay: newest snapshot, then
//     ordered batches by sequence; unresolved gaps are rejected; the decoder reads to end
//     and verifies the checksum (detects damage; cannot recreate missing bytes).
//   workerd src/workerd/server/cluster/owner.rs — Owner::open / open_epoch / compact:
//     non-authoritative local DB removed on takeover; restore the previous opened epoch,
//     upload the starting snapshot, then the conditional open (from = epoch); compaction
//     writes a newer snapshot before discarding covered history.
//   celld v0.6.3 (8702f6d) docs/guarantees.md — "epoch chain", "takeover recovery gate";
//     crates/celld/ltx_repl.rs, crates/celld/node_log.rs: fleet mode is the default; the
//     owner recruits up to two followers, every follower in the proof fsyncs, at least one
//     required, the owner never counts itself; no ensemble → bucket proof. Fleet acks may
//     precede the bucket upload, so takeover must seal the predecessor node-log session,
//     obtain the complete retained follower range, upload it, mark the session sealed, and
//     only then restore the cell. Recovery may block when completeness can't be certified.
//   Workerd's path here is bucket-only: no follower proof is claimed for workerd.
//
// Machine: a recoverable tape under the bucket feeds a replay reader that rebuilds a
// replacement SQLite page grid. A missing batch jams the reader; a corrupt batch is
// rejected; compaction writes a snapshot before deleting. Then the same tape switches,
// under a prominent badge, to celld fleet mode: follower disks extend the durable tail
// past the bucket, and a sealing door must close before the successor restores.
// Sequence ranges, pages, m42 and hosts are illustrative.
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
const BKT = { x: 640, y: 128, w: 300, h: 70 };
const TAPE_Y = 250;
const TILE_W = 126;
const TILE_H = 56;
const tileX = (i: number) => 180 + i * 136;

/** Tape fixture (illustrative ranges). pages = pages the batch changes. */
const TILES = [
  { label: 'snapshot @0', start: 0, end: 0, snap: true, pages: [] as number[] },
  { label: 'seq 1–3', start: 1, end: 3, snap: false, pages: [1, 3] },
  { label: 'seq 4–6', start: 4, end: 6, snap: false, pages: [2, 3] },
  { label: 'seq 4–9', start: 4, end: 9, snap: false, pages: [2, 3, 7] },
  { label: 'seq 10–12', start: 10, end: 12, snap: false, pages: [3, 9] },
];
const LTX_LABELS = ['snapshot', 'TXID 1–3', 'TXID 4–6', 'TXID 4–9', 'TXID 10–12'];

/** covered[i] = highest sequence covered after applying tiles 0..i (full tape). */
const COVERED: number[] = (() => {
  const out: number[] = [];
  let c = 0;
  TILES.forEach((t) => {
    c = Math.max(c, t.end);
    out.push(c);
  });
  return out;
})();

const GRID = { x: 330, y: 400, cell: 40, gap: 6, cols: 4, rows: 3 };
const REPL = { x: 200, y: 460 };

/** Celld fleet layout. */
const OWNER = { x: 200, y: 410 };
const SUCC = { x: 200, y: 540 };
const F1 = { x: 540, y: 430 };
const F2 = { x: 740, y: 430 };
const F3 = { x: 920, y: 430 };
const DOOR = { x: 370, y: 430 };
const TAIL_X = tileX(5);

const CAM_TAPE: CameraState = { x: 560, y: 330, k: 1.15 };
const CAM_JAM: CameraState = { x: 640, y: 348, k: 1.25 };
const CAM_FLEET: CameraState = { x: 640, y: 380, k: 1.1 };
const CAM_SEAL: CameraState = { x: 660, y: 385, k: 1.12 };

/* ---------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stageU = tl.channel('stageU', 0);
  const snapU = tl.channel('snapU', 0); // base image from snapshot
  const replayU = tl.channel('replayU', 0); // ordered batches apply
  const seqU = tl.channel('seqU', 0); // coverage gauge + overlap callout
  const gapU = tl.channel('gapU', 0);
  const corruptU = tl.channel('corruptU', 0);
  const compactU = tl.channel('compactU', 0);
  const openU = tl.channel('openU', 0);
  const modeU = tl.channel('modeU', 0); // switch to celld fleet mode
  const fleetU = tl.channel('fleetU', 0); // ack before upload, one follower
  const followU = tl.channel('followU', 0); // second follower; owner ≠ follower
  const fallbackU = tl.channel('fallbackU', 0);
  const obligU = tl.channel('obligU', 0); // owner dies; obligation
  const sealU = tl.channel('sealU', 0); // seal → upload ranges → mark sealed → restore
  const blockU = tl.channel('blockU', 0);
  const endU = tl.channel('endU', 0);

  // 1 — ownership to recover, not trust in local disk
  tl.caption({ at: 0.5, dur: 10, text: 'The replacement starts with ownership to recover, not permission to trust whatever happens to be on its local disk. In workerd, a takeover rebuilds state from the bucket-backed predecessor.' });
  tl.tween(stageU, 1, { at: B(1) + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_TAPE, { at: B(1) + 4.0, dur: 1.5, ease: ease.move });

  // 2 — snapshot base image, then ordered batches
  tl.caption({ at: 11.5, dur: 10, text: "A snapshot supplies a base image. Ordered log batches then apply the committed page changes after that image, so the database can be reconstructed without rerunning the application's old requests." });
  tl.tween(snapU, 1, { at: B(2) + 0.4, dur: 2.4, ease: ease.move });
  tl.tween(replayU, 0.5, { at: B(2) + 3.2, dur: 5.6, ease: ease.linear });

  // 3 — sequence numbers; overlapping compacted batches
  tl.caption({ at: 22.5, dur: 10, text: 'Sequence numbers tell the replay engine which changes are already covered. Compacted batches may overlap earlier ones, but the restored state must still follow one complete committed history.' });
  tl.tween(seqU, 1, { at: B(3) + 0.2, dur: 1.0, ease: ease.enter });
  tl.tween(replayU, 1, { at: B(3) + 1.0, dur: 7.0, ease: ease.linear });

  // 4 — a missing batch jams the reader
  tl.caption({ at: 33.5, dur: 10, text: 'Remove a required batch and the replay machine must stop. Workerd checks for unresolved gaps; silently skipping one would turn a successful restart into an undetected loss of state.' });
  tl.tween(cam, CAM_JAM, { at: B(4) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(gapU, 1, { at: B(4) + 0.8, dur: 9.0, ease: ease.linear });

  // 5 — a corrupt batch is rejected
  tl.caption({ at: 44.5, dur: 10, text: 'Corrupt a batch and checksum validation can reject it. A checksum detects damaged bytes; it cannot invent a missing page, repair every storage failure, or replace the need for retained durable data.' });
  tl.tween(corruptU, 1, { at: B(5) + 0.6, dur: 9.0, ease: ease.linear });

  // 6 — compaction: snapshot first, then delete
  tl.caption({ at: 55.5, dur: 10, text: 'Compaction writes a newer snapshot before discarding the history it covers. That ordering keeps a recovery base available while reducing the number of files a future takeover must read.' });
  tl.tween(cam, CAM_TAPE, { at: B(6) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(compactU, 1, { at: B(6) + 1.0, dur: 8.0, ease: ease.linear });

  // 7 — open the epoch only after recovery + starting snapshot
  tl.caption({ at: 66.5, dur: 10, text: 'Only after recovery and its starting snapshot does workerd finish opening the new epoch. If a claimant dies before that point, the next claimant retains the earlier recovery source.' });
  tl.tween(openU, 1, { at: B(7) + 0.6, dur: 8.5, ease: ease.linear });

  // 8 — celld fleet proof: ack while bucket upload pending
  tl.caption({ at: 77.5, dur: 10, text: "Celld's current default adds another route to durability: a fleet proof. Here a message may be acknowledged while its bucket upload is still pending, because followers have already preserved the tail." });
  tl.tween(modeU, 1, { at: B(8) + 0.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_FLEET, { at: B(8) + 0.4, dur: 1.5, ease: ease.move });
  tl.tween(fleetU, 1, { at: B(8) + 2.0, dur: 7.5, ease: ease.linear });

  // 9 — one or two followers fsync; the owner never counts itself
  tl.caption({ at: 88.5, dur: 10, text: 'The owner recruits one or two other nodes, and the proof requires those followers to flush the write to disk. The owner cannot count itself as its own independent follower.' });
  tl.tween(followU, 1, { at: B(9) + 0.6, dur: 8.0, ease: ease.linear });

  // 10 — no ensemble → bucket proof
  tl.caption({ at: 99.5, dur: 10, text: 'With no available follower ensemble, celld falls back to a bucket proof. A third machine can add a second follower, but the actual proof depends on the ensemble present for that write.' });
  tl.tween(fallbackU, 1, { at: B(10) + 0.6, dur: 8.6, ease: ease.linear });

  // 11 — the recovery obligation
  tl.caption({ at: 110.5, dur: 10, text: 'This faster path creates a recovery obligation. Before a successor restores the cell, it must fence the previous node-log session and recover the acknowledged tail retained by the followers.' });
  tl.tween(cam, CAM_SEAL, { at: B(11) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(obligU, 1, { at: B(11) + 0.8, dur: 7.0, ease: ease.linear });

  // 12 — seal, upload ranges, mark sealed, then proceed
  tl.caption({ at: 121.5, dur: 10, text: "Sealing prevents the old session from completing new fleet proofs. Recovery uploads the retained ranges, marks the session sealed, and only then lets the successor proceed with the cell's history." });
  tl.tween(cam, CAM_FLEET, { at: B(12) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(sealU, 1, { at: B(12) + 0.8, dur: 9.0, ease: ease.linear });

  // 13 — missing proof blocks
  tl.caption({ at: 132.5, dur: 10, text: 'If the required tail cannot be certified complete, recovery may block. A follower error or damaged range is not permission to pretend that no acknowledged data existed there.' });
  tl.tween(blockU, 1, { at: B(13) + 0.6, dur: 8.6, ease: ease.linear });

  // 14 — the paths agree about where the bytes must be
  tl.caption({ at: 143.5, dur: 10, text: "Our message survives because the proof and recovery paths agree about where its bytes must be. The bucket-only workerd path and celld's follower path meet that obligation in different ways." });
  tl.tween(cam, CAMERA_HOME, { at: B(14) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(endU, 1, { at: B(14) + 1.0, dur: 1.2, ease: ease.enter });
  tl.hold(153.5, 0.5);

  return {
    tl, cam, stageU, snapU, replayU, seqU, gapU, corruptU, compactU, openU, modeU, fleetU, followU,
    fallbackU, obligU, sealU, blockU, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------- derived (closed form) */
/** Reader position in tile units (0..4) and how many tiles applied, from replay. */
function readerAt(replay: number): { pos: number; applied: number } {
  const pos = replay * 4;
  return { pos, applied: Math.floor(pos + 1e-6) };
}

/** Gap demo: tile 3 removed; reader advances from tile 2 to tile 4 and jams. */
function gapState(g: number): { removed: number; pos: number; jam: number } {
  const removed = seg(g, 0.0, 0.12) * (1 - seg(g, 0.82, 0.95));
  const pos = lerp(2, 4, seg(g, 0.15, 0.35));
  const jam = seg(g, 0.35, 0.42) * (1 - seg(g, 0.82, 0.9));
  return { removed, pos, jam };
}

/* ------------------------------------------------------ subcomponents */

function Tape({ gap, corrupt, compact, mode, fleet, seal, block, end }: { gap: number; corrupt: number; compact: number; mode: number; fleet: number; seal: number; block: number; end: number }) {
  const g = gapState(gap);
  const corrupting = seg(corrupt, 0.1, 0.25) * (1 - seg(corrupt, 0.85, 0.95));
  const snapNew = seg(compact, 0.1, 0.3);
  const discard = seg(compact, 0.45, 0.7);
  const shift = seg(compact, 0.75, 0.95);
  const ltx = seg(mode, 0.3, 0.7);
  return (
    <g>
      <line x1={150} y1={TAPE_Y - TILE_H / 2 - 6} x2={1150} y2={TAPE_Y - TILE_H / 2 - 6} stroke={MUTED} strokeWidth={1.4} opacity={0.6} />
      <line x1={150} y1={TAPE_Y + TILE_H / 2 + 6} x2={1150} y2={TAPE_Y + TILE_H / 2 + 6} stroke={MUTED} strokeWidth={1.4} opacity={0.6} />
      {TILES.map((t, i) => {
        const off = i === 3 ? g.removed : 0;
        const bad = i === 4 ? corrupting : 0;
        const gone = (1 - 0.85 * discard) * (1 - shift);
        const color = t.snap ? SECONDARY : bad > 0.3 ? NEGATIVE : TEAL;
        return (
          <g key={i} transform={`translate(${tileX(i)}, ${TAPE_Y - 40 * off})`} opacity={(1 - off) * gone}>
            <rect x={0} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={7} fill={PANEL} stroke={color} strokeWidth={2.2} />
            {bad > 0.01 ? (
              <path d="M 8 -14 l 14 18 l 14 -18 l 14 18 l 14 -18 l 14 18 l 14 -18 l 14 18 l 10 -12" fill="none" stroke={NEGATIVE} strokeWidth={2} opacity={bad} />
            ) : null}
            <text x={TILE_W / 2} y={7} textAnchor="middle" fill={color} fontSize={t.label.length > 9 ? 16 : 18} fontFamily={MONO} opacity={1 - ltx}>
              {t.label}
            </text>
            <text x={TILE_W / 2} y={7} textAnchor="middle" fill={color} fontSize={18} fontFamily={MONO} opacity={ltx}>
              {LTX_LABELS[i]}
            </text>
            {i === 4 ? <Label x={TILE_W / 2} y={TILE_H / 2 + 26} text="m42" color={WARM} size={16} mono opacity={1 - ltx} /> : null}
          </g>
        );
      })}
      {/* the removed batch leaves a visible hole in the history */}
      <rect x={tileX(3)} y={TAPE_Y - TILE_H / 2} width={TILE_W} height={TILE_H} rx={7} fill="none" stroke={NEGATIVE} strokeWidth={2} strokeDasharray="6 5" opacity={g.removed} />
      {/* newer snapshot (compaction) — written first, then history is discarded */}
      <g transform={`translate(${lerp(tileX(5), tileX(0), shift)}, ${TAPE_Y})`} opacity={snapNew}>
        <rect x={0} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={7} fill={PANEL} stroke={SECONDARY} strokeWidth={2.6} />
        <text x={TILE_W / 2} y={7} textAnchor="middle" fill={SECONDARY} fontSize={ltx > 0.5 ? 18 : 16} fontFamily={MONO}>
          {ltx > 0.5 ? 'snapshot' : 'snapshot @12'}
        </text>
      </g>
      <g opacity={seg(compact, 0.15, 0.3) * (1 - seg(compact, 0.9, 1))}>
        <Pill x={tileX(5) + TILE_W / 2} y={TAPE_Y + 64} text="1 · write snapshot" color={SECONDARY} size={18} fill={colors.BG} />
      </g>
      <g opacity={seg(compact, 0.45, 0.6) * (1 - seg(compact, 0.9, 1))}>
        <Pill x={tileX(2) + TILE_W / 2} y={TAPE_Y + 64} text="2 · then discard covered history" color={MUTED} size={18} fill={colors.BG} />
      </g>
      <TailTile mode={mode} fleet={fleet} seal={seal} block={block} end={end} />
    </g>
  );
}

/** Celld's durable tail beyond the bucket — retained by followers until uploaded. */
function TailTile({ mode, fleet, seal, block, end }: { mode: number; fleet: number; seal: number; block: number; end: number }) {
  const show = seg(fleet, 0.05, 0.2);
  if (show <= 0.001 || mode <= 0.5) return null;
  const blocked = seg(block, 0.05, 0.15) * (1 - seg(block, 0.9, 1));
  const uploaded = Math.max(seg(seal, 0.45, 0.6) * (1 - blocked), end);
  const color = uploaded > 0.5 ? TEAL : WARM;
  const w = TILE_W + 20;
  return (
    <g transform={`translate(${TAIL_X}, ${TAPE_Y})`} opacity={show}>
      <rect x={0} y={-TILE_H / 2} width={w} height={TILE_H} rx={7} fill={PANEL} stroke={color} strokeWidth={2.4} strokeDasharray={uploaded > 0.5 ? undefined : '7 5'} />
      <text x={w / 2} y={7} textAnchor="middle" fill={color} fontSize={18} fontFamily={MONO}>
        tail · m42
      </text>
      <Label x={w / 2} y={-TILE_H / 2 - 12} text={uploaded > 0.5 ? 'uploaded' : 'upload pending'} color={color} size={16} />
    </g>
  );
}

function Reader({ replay, gap, corrupt, mode }: { replay: number; gap: number; corrupt: number; mode: number }) {
  if (replay <= 0.001 && gap <= 0.001 && corrupt <= 0.001) return null;
  let pos = readerAt(replay).pos;
  let jam = 0;
  if (gap > 0.001 && gap < 0.999) {
    const g = gapState(gap);
    pos = g.pos;
    jam = g.jam;
  }
  let reject = 0;
  if (corrupt > 0.001 && corrupt < 0.999) {
    pos = lerp(3, 4, seg(corrupt, 0.25, 0.4));
    reject = seg(corrupt, 0.4, 0.48) * (1 - seg(corrupt, 0.85, 0.92));
  }
  const shake = jam > 0 ? Math.sin(gap * 160) * 4 * jam : 0;
  const x = tileX(0) + pos * 136 + TILE_W / 2 + shake;
  const c = jam > 0.3 || reject > 0.3 ? NEGATIVE : ACCENT;
  return (
    <g opacity={1 - mode}>
      <path d={`M ${x} ${TAPE_Y - TILE_H / 2 - 10} l -12 -20 l 24 0 Z`} fill={c} />
      <line x1={x} y1={TAPE_Y + TILE_H / 2 + 10} x2={x} y2={GRID.y - 34} stroke={c} strokeWidth={2} strokeDasharray="4 5" opacity={0.6} />
    </g>
  );
}

function Rebuilt({ snap, replay, gap, corrupt, mode }: { snap: number; replay: number; gap: number; corrupt: number; mode: number }) {
  if (snap <= 0.001) return null;
  const { pos } = readerAt(replay);
  // during the failure demos the last batch is NOT applied
  const failing = Math.max(gapState(gap).jam, seg(corrupt, 0.4, 0.5) * (1 - seg(corrupt, 0.85, 0.95)));
  const effPos = failing > 0.3 ? 3.4 : pos;
  return (
    <g opacity={1 - mode}>
      <Host x={REPL.x} y={REPL.y} label="replacement" color={POSITIVE} />
      <Label x={GRID.x} y={GRID.y - 14} text="SQLite, rebuilt by replay" color={POSITIVE} size={18} anchor="start" />
      {Array.from({ length: GRID.cols * GRID.rows }, (_, i) => {
        const page = i + 1;
        const c = i % GRID.cols;
        const r = Math.floor(i / GRID.cols);
        const base = seg(snap, i / 14, i / 14 + 0.3);
        let last = -1;
        TILES.forEach((t, k) => {
          if (t.pages.includes(page) && effPos >= k + 0.5) last = k;
        });
        const changed = last >= 0;
        const missing = page === 9 && failing > 0.3;
        const x = GRID.x + c * (GRID.cell + GRID.gap);
        const y = GRID.y + r * (GRID.cell + GRID.gap);
        return (
          <g key={i} opacity={base}>
            <rect
              x={x}
              y={y}
              width={GRID.cell}
              height={GRID.cell}
              rx={5}
              fill={missing ? colors.BG : changed ? WARM : PANEL}
              fillOpacity={missing ? 1 : changed ? 0.55 : 1}
              stroke={missing ? NEGATIVE : changed ? WARM : MUTED}
              strokeWidth={1.6}
              strokeDasharray={missing ? '4 3' : undefined}
            />
            <text x={x + GRID.cell / 2} y={y + 26} textAnchor="middle" fill={missing ? NEGATIVE : TEXT} fontSize={18} fontFamily={MONO}>
              {missing ? '?' : page}
            </text>
          </g>
        );
      })}
      <Msg x={GRID.x + 240} y={GRID.y + 70} label="m42" color={POSITIVE} opacity={seg(replay, 0.92, 1) * (1 - failing)} />
      <Illus x={GRID.x + 200} y={GRID.y + 22} text="old local disk discarded: not authoritative" opacity={snap * (1 - seg(replay, 0.5, 0.6))} />
    </g>
  );
}

function Coverage({ u, replay, gap, mode }: { u: number; replay: number; gap: number; mode: number }) {
  if (u <= 0.001) return null;
  const { applied } = readerAt(replay);
  const covered = COVERED[Math.min(4, applied)];
  const overlap = seg(replay, 0.7, 0.8);
  return (
    <g opacity={u * (1 - mode) * (1 - seg(gap, 0, 0.05))}>
      <Pill x={1100} y={TAPE_Y + 80} text={`covered through seq ${covered}`} color={POSITIVE} size={18} mono anchor="end" fill={colors.BG} />
      <g opacity={overlap}>
        <path d={`M ${tileX(2) + 20} ${TAPE_Y + 36} Q ${tileX(3) - 8} ${TAPE_Y + 64} ${tileX(3) + 40} ${TAPE_Y + 36}`} fill="none" stroke={WARM} strokeWidth={2} />
        <Pill x={tileX(3) - 8} y={TAPE_Y + 74} text="overlap 4–6: already covered" color={WARM} size={18} fill={colors.BG} />
      </g>
    </g>
  );
}

function OpenSteps({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const steps = ['recover from epoch 7', 'upload starting snapshot', 'open: from = 9'];
  const dies = seg(u, 0.12, 0.3) * (1 - seg(u, 0.38, 0.45));
  return (
    <g opacity={clamp01(u * 6)}>
      <rect x={600} y={322} width={490} height={218} rx={14} fill={colors.BG} stroke={MUTED} strokeWidth={1.4} />
      <Label x={620} y={354} text="takeover order (epoch 9 claimant)" color={MUTED} size={18} anchor="start" />
      {steps.map((st, i) => {
        const on = seg(u, 0.45 + i * 0.14, 0.55 + i * 0.14);
        return <Pill key={st} x={630} y={396 + i * 46} text={`${i + 1} · ${st}`} color={i === 2 ? POSITIVE : TEAL} size={18} anchor="start" opacity={(1 - dies) * (0.35 + 0.65 * on)} />;
      })}
      <g opacity={dies}>
        <Pill x={630} y={396} text="claimant dies before open" color={NEGATIVE} size={18} anchor="start" fill={colors.BG} />
        <Pill x={630} y={442} text="own.json keeps from = 7" color={WARM} size={18} mono anchor="start" fill={colors.BG} />
      </g>
    </g>
  );
}

function ModeBadge({ mode }: { mode: number }) {
  return (
    <g>
      <Pill x={24} y={40} text="workerd · bucket-proof path" color={TEAL} size={20} bold anchor="start" opacity={1 - mode} fill={colors.BG} />
      <Pill x={24} y={40} text="celld v0.6.3 · fleet mode (default)" color={SECONDARY} size={20} bold anchor="start" opacity={mode} fill={colors.BG} />
    </g>
  );
}

function Disk({ x, y, label, color, u, bad = 0 }: { x: number; y: number; label: string; color: string; u: number; bad?: number }) {
  if (u <= 0.001) return null;
  const c = bad > 0.5 ? NEGATIVE : color;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={u}>
      <path d="M -40 -10 L -40 14 A 40 10 0 0 0 40 14 L 40 -10" fill={PANEL} stroke={c} strokeWidth={2} />
      <ellipse cx={0} cy={-10} rx={40} ry={10} fill={PANEL} stroke={c} strokeWidth={2} />
      <Label x={0} y={46} text={label} color={c} size={16} />
    </g>
  );
}

function Stepper({ seal, block, oblig }: { seal: number; block: number; oblig: number }) {
  const show = seg(oblig, 0.6, 0.75);
  if (show <= 0.001) return null;
  const steps = ['fence old session', 'collect complete tail', 'upload tail', 'mark sealed', 'restore cell'];
  const thresholds = [0.15, 0.3, 0.5, 0.7, 0.92];
  const blocked = seg(block, 0.05, 0.15) * (1 - seg(block, 0.9, 1));
  return (
    <g opacity={show}>
      {steps.map((st, i) => {
        const done = seal >= thresholds[i];
        const stuck = blocked > 0.5 && i >= 1;
        const c = stuck ? (i === 1 ? WARM : MUTED) : done ? POSITIVE : MUTED;
        const mark = stuck && i === 1 ? '⏸' : done && !stuck ? '✓' : '·';
        return <Pill key={st} x={900} y={374 + i * 46} text={`${mark} ${st}`} color={c} size={18} anchor="start" fill={colors.BG} opacity={stuck && i > 1 ? 0.35 : 1} />;
      })}
    </g>
  );
}

function Fleet({ mode, fleet, follow, fallback, oblig, seal, block, end }: { mode: number; fleet: number; follow: number; fallback: number; oblig: number; seal: number; block: number; end: number }) {
  if (mode <= 0.001) return null;
  const f1 = seg(fleet, 0.05, 0.2);
  const f2 = seg(follow, 0.05, 0.25);
  const down = seg(fallback, 0.05, 0.15) * (1 - seg(fallback, 0.65, 0.75));
  const f3 = seg(fallback, 0.65, 0.8);
  const ownerDead = seg(oblig, 0.05, 0.2);
  const succ = seg(oblig, 0.3, 0.45);
  const door = seg(seal, 0.05, 0.2);
  const upload = seg(seal, 0.3, 0.5);
  const marked = seg(seal, 0.6, 0.7);
  const restore = seg(seal, 0.8, 0.95);
  const blocked = seg(block, 0.05, 0.15) * (1 - seg(block, 0.9, 1));
  const fsync = seg(fleet, 0.3, 0.45);
  const ack = seg(fleet, 0.55, 0.7);
  const repl = (to: { x: number; y: number }, on: number) => (
    <line x1={OWNER.x + 50} y1={OWNER.y} x2={to.x - 50} y2={to.y} stroke={SECONDARY} strokeWidth={2.2} strokeDasharray="6 5" opacity={on} />
  );
  return (
    <g opacity={mode * (1 - 0.88 * end)}>
      {repl(F1, f1 * (1 - down) * (1 - ownerDead))}
      {repl(F2, f2 * (1 - down) * (1 - ownerDead))}
      <Host x={OWNER.x} y={OWNER.y} label="owner A" color={ACCENT} dead={ownerDead} />
      <Host x={F1.x} y={F1.y} label="follower 1" color={SECONDARY} opacity={f1} dead={down} />
      <Host x={F2.x} y={F2.y} label="follower 2" color={SECONDARY} opacity={f2} dead={down} />
      <Host x={F3.x} y={F3.y} label="3rd machine" color={MUTED} opacity={f3 * (1 - seg(oblig, 0.45, 0.6))} />
      {/* blocked counterexample: NO current follower can certify the complete tail */}
      <Disk x={F1.x} y={F1.y + 112} label={blocked > 0.5 ? 'range incomplete' : 'tail · fsync ✓'} color={blocked > 0.5 ? WARM : POSITIVE} u={fsync * (1 - down)} />
      <Disk x={F2.x} y={F2.y + 112} label={blocked > 0.5 ? 'range damaged' : 'tail · fsync ✓'} color={POSITIVE} u={seg(follow, 0.3, 0.45) * (1 - down)} bad={blocked} />
      {/* the owner's own disk does not count as a follower */}
      <g opacity={seg(follow, 0.55, 0.7) * (1 - seg(fallback, 0, 0.05))}>
        <Disk x={OWNER.x} y={OWNER.y + 112} label="owner's disk" color={MUTED} u={1} />
        <Pill x={OWNER.x + 48} y={OWNER.y + 112} text="✗ not its own follower" color={NEGATIVE} size={18} anchor="start" fill={colors.BG} />
      </g>
      <g opacity={ack * (1 - seg(fallback, 0, 0.05))}>
        <Pill x={640} y={332} text={follow > 0.3 ? 'fleet proof: 2 followers fsync → ack m42' : 'fleet proof: follower fsync → ack m42'} color={POSITIVE} size={20} fill={colors.BG} />
      </g>
      {/* no ensemble → bucket proof */}
      <g opacity={down}>
        <Arrow x1={OWNER.x + 20} y1={OWNER.y - 40} x2={BKT.x - 150} y2={BKT.y + 30} color={TEAL} width={2.6} u={seg(fallback, 0.1, 0.3)} />
        <Pill x={470} y={332} text="no follower ensemble → bucket proof" color={TEAL} size={20} fill={colors.BG} />
      </g>
      <g opacity={f3 * (1 - seg(oblig, 0, 0.1))}>
        <Pill x={640} y={332} text="the proof = the ensemble present for that write" color={TEXT} size={20} fill={colors.BG} />
      </g>
      <Host x={SUCC.x} y={SUCC.y} label="successor" color={POSITIVE} opacity={succ} />
      <g opacity={seg(oblig, 0.45, 0.6) * (1 - door)}>
        <Pill x={640} y={332} text="before restore: fence old session + recover tail" color={WARM} size={20} fill={colors.BG} />
      </g>
      {/* sealing door between the old session and its followers */}
      <g transform={`translate(${DOOR.x}, ${DOOR.y})`} opacity={Math.max(door, seg(oblig, 0.6, 0.75) * 0.5)}>
        <rect x={-10} y={-40} width={20} height={110} fill={PANEL} stroke={NEGATIVE} strokeWidth={2.4} />
        <rect x={-10} y={-40} width={20} height={110 * door} fill={NEGATIVE} opacity={0.75} />
        <Label x={0} y={94} text={marked > 0.5 && blocked < 0.5 ? 'session sealed' : 'fence'} color={NEGATIVE} size={18} bold />
      </g>
      <g opacity={door * (1 - upload)}>
        <Pill x={640} y={332} text="sealed: old session can't complete new fleet proofs" color={NEGATIVE} size={20} fill={colors.BG} />
      </g>
      {upload > 0 && upload < 1 && blocked < 0.5 ? (
        <g>
          <circle cx={lerp(F1.x, TAIL_X + 70, upload)} cy={lerp(F1.y - 40, TAPE_Y + 30, upload)} r={8} fill={TEAL} />
          <circle cx={lerp(F2.x, TAIL_X + 70, upload)} cy={lerp(F2.y - 40, TAPE_Y + 30, upload)} r={8} fill={TEAL} />
        </g>
      ) : null}
      <Stepper seal={seal} block={block} oblig={oblig} />
      <g opacity={restore * (1 - blocked)}>
        <Arrow x1={TAIL_X + 20} y1={TAPE_Y + 36} x2={SUCC.x + 56} y2={SUCC.y - 20} color={POSITIVE} width={2.6} u={restore} />
        <Msg x={SUCC.x + 110} y={SUCC.y + 6} label="m42" color={POSITIVE} />
      </g>
      <WarnCard
        x={600}
        y={284}
        w={580}
        title="no complete tail proof: recovery blocks"
        lines={['follower 1: range incomplete · follower 2: damaged', 'acknowledged data may exist there → do not restore']}
        opacity={seg(block, 0.2, 0.35) * (1 - seg(block, 0.9, 1))}
        color={WARM}
      />
    </g>
  );
}

/* --------------------------------------------------------------- frame */
export function Render({ s }: { s: SceneState }) {
  const stage = s.get(scene.stageU);
  const replay = s.get(scene.replayU);
  const gap = s.get(scene.gapU);
  const corrupt = s.get(scene.corruptU);
  const compact = s.get(scene.compactU);
  const mode = s.get(scene.modeU);
  const fleet = s.get(scene.fleetU);
  const seal = s.get(scene.sealU);
  const block = s.get(scene.blockU);
  const end = s.get(scene.endU);
  const open = s.get(scene.openU);
  const g = gapState(gap);
  const corruptWarn = seg(corrupt, 0.45, 0.55) * (1 - seg(corrupt, 0.85, 0.95));
  return (
    <>
      <Backdrop />
      <Camera {...s.get(scene.cam)}>
        <g opacity={stage}>
          <g opacity={1 - 0.88 * end}>
            <Bucket x={BKT.x} y={BKT.y} w={BKT.w} h={BKT.h} label="bucket" />
            <Tape gap={gap} corrupt={corrupt} compact={compact} mode={mode} fleet={fleet} seal={seal} block={block} end={end} />
            <Reader replay={replay} gap={gap} corrupt={corrupt} mode={mode} />
            <Coverage u={s.get(scene.seqU)} replay={replay} gap={gap} mode={mode} />
            <Rebuilt snap={s.get(scene.snapU)} replay={replay} gap={gap} corrupt={corrupt} mode={Math.max(mode, clamp01(open * 5) * 0.5)} />
          </g>
          <WarnCard
            x={840}
            y={330}
            w={560}
            title="gap: seq 7–9 unresolved → stop"
            lines={['next batch starts at 10; coverage ends at 6', 'skipping it would hide lost state (check_gaps)']}
            opacity={g.jam}
          />
          <WarnCard
            x={840}
            y={330}
            w={560}
            title="checksum mismatch → batch rejected"
            lines={['damage detected; page 9 cannot be invented', 'recovery stays blocked until good data exists']}
            opacity={corruptWarn}
          />
          <OpenSteps u={open * (1 - mode)} />
          <Fleet
            mode={mode}
            fleet={fleet}
            follow={s.get(scene.followU)}
            fallback={s.get(scene.fallbackU)}
            oblig={s.get(scene.obligU)}
            seal={seal}
            block={block}
            end={end}
          />
        </g>
        <Takeaway
          u={end}
          y={360}
          w={1000}
          title="m42 survives: proof and recovery agree"
          lines={[
            { text: 'workerd: bucket proof before ack · restore = snapshot + gap-free replay', color: TEAL },
            { text: 'celld fleet: follower fsync proof · seal + recover tail before restore', color: SECONDARY },
            { text: 'missing or damaged proof blocks — never silently green', color: WARM },
          ]}
          foot="verified prefix: snapshot … seq 12 · then sealed tail (m42)"
        />
      </Camera>
      {/* screen space: the path title and the fixture footer never ride the camera */}
      <g opacity={stage * (1 - end)}>
        <ModeBadge mode={mode} />
        <Illus x={24} y={612} text="sequence ranges, pages, m42, hosts: illustrative" />
      </g>
    </>
  );
}

export const vizScene = () => scene;
