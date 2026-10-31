// The bucket is the referee
//
// Sources:
//   workerd src/workerd/server/cluster/ownership.rs — OwnerRecord { node, epoch, from }
//     under do/<namespace>/<actor>/own.json; successor / Ownership::acquire_or_route /
//     open; Guard::Absent and Guard::Match(version) conditional writes.
//   workerd cluster bucket.rs — Guard (absent / match) mapped to conditional PUTs.
//   celld crates/celld/ownership_store.rs and docs/guarantees.md — store qualification:
//     conditional create, rejected create, update, stale-update rejection; strong reads.
//   AWS S3 docs: docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html
//     (If-None-Match: *, If-Match: <ETag>) and .../Welcome.html (consistency model).
//
// Machine: a compare-and-swap latch sits on the only door to one authority key. First
// the naive protocol (read, then unconditional PUT) lets two hosts both believe they own
// the room — counted on stage as a broken invariant. Rewind, install the latch, and
// race again: absent-create and version-match let exactly one write through; the loser
// must reread. The bucket's interior stays an opaque service boundary.
// Fixtures: room "lobby", hosts A/B, version tags V7/V8 (opaque ETags, not hashes),
// record values — all illustrative. The key schema is real.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  B,
  Backdrop,
  Bucket,
  Host,
  Illus,
  Label,
  MONO,
  Pill,
  Takeaway,
  WarnCard,
  clamp01,
  lerp,
  seg,
} from './shared/kit';

const { ACCENT, WARM, POSITIVE, SECONDARY, NEGATIVE, TEAL, MUTED, TEXT, PANEL } = colors;

/* ------------------------------------------------------------ layout */
const HA = { x: 190, y: 300 };
const HB = { x: 1090, y: 300 };
const LATCH = { x: 640, y: 310, r: 58 };
const BKT = { x: 640, y: 468, w: 460, h: 150 };
const CARD = { x: 640, y: 458, w: 400, h: 92 };
const KEY = 'do/ns/lobby/own.json';

// Push-ins sized so the whole active race (hosts, claims, latch, bucket rim) stays in frame.
const CAM_GAP: CameraState = { x: 640, y: 325, k: 1.08 };
const CAM_LATCH: CameraState = { x: 640, y: 340, k: 1.12 };
const CAM_CAS: CameraState = { x: 640, y: 335, k: 1.1 };
const CAM_READ: CameraState = { x: 900, y: 380, k: 1.25 };
const CAM_TESTS: CameraState = { x: 900, y: 420, k: 1.25 };
const CAM_SCOPE: CameraState = { x: 640, y: 420, k: 1.3 };
const CAM_BUCKET: CameraState = { x: 640, y: 480, k: 1.7 };

/**
 * Screen-fit visibility: 1 while the world box sits inside the safe frame
 * (x 20…1260, y 20…598) under camera c, fading to 0 over 28 px of overflow —
 * context a push-in would chop fades out instead of being cut.
 */
function fit(c: CameraState, x0: number, x1: number, y0: number, y1: number): number {
  const sx0 = (x0 - c.x) * c.k + 640;
  const sx1 = (x1 - c.x) * c.k + 640;
  const sy0 = (y0 - c.y) * c.k + 360;
  const sy1 = (y1 - c.y) * c.k + 360;
  const over = Math.max(0, 20 - sx0, sx1 - 1260, 20 - sy0, sy1 - 598);
  return clamp01(1 - over / 28);
}

/** Teeth of the latch ring, precomputed. */
const TEETH = Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2);

type P = { x: number; y: number };
const along = (pts: P[], u: number): P => {
  const n = pts.length - 1;
  const f = clamp01(u) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const k = f - i;
  return { x: lerp(pts[i].x, pts[i + 1].x, k), y: lerp(pts[i].y, pts[i + 1].y, k) };
};
/** Paths to the record: direct (no latch) and through the latch. */
const DIRECT_A: P[] = [{ x: HA.x + 50, y: HA.y }, { x: CARD.x - 150, y: CARD.y - 10 }];
const DIRECT_B: P[] = [{ x: HB.x - 50, y: HB.y }, { x: CARD.x + 150, y: CARD.y - 10 }];
const VIA_A: P[] = [{ x: HA.x + 50, y: HA.y }, { x: LATCH.x - LATCH.r - 6, y: LATCH.y }];
const VIA_B: P[] = [{ x: HB.x - 50, y: HB.y }, { x: LATCH.x + LATCH.r + 6, y: LATCH.y }];
const THROUGH: P[] = [{ x: LATCH.x, y: LATCH.y }, { x: CARD.x, y: CARD.y - CARD.h / 2 }];

/* ---------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stageU = tl.channel('stageU', 0); // hosts + bucket + record
  const readU = tl.channel('readU', 0); // naive: both read ∅
  const writeU = tl.channel('writeU', 0); // naive: both PUT, overwrite
  const warnU = tl.channel('warnU', 0);
  const gapU = tl.channel('gapU', 0); // read→write gap lane
  const rewindU = tl.channel('rewindU', 0);
  const latchU = tl.channel('latchU', 0);
  const createU = tl.channel('createU', 0); // If-None-Match: * race
  const matchU = tl.channel('matchU', 0); // If-Match: V7 race
  const casU = tl.channel('casU', 0); // CAS definition + guard chips
  const recordU = tl.channel('recordU', 0); // OwnerRecord fields + JS-on-host
  const pagesU = tl.channel('pagesU', 0); // page objects slide behind the latch
  const strongU = tl.channel('strongU', 0);
  const testsU = tl.channel('testsU', 0);
  const scopeU = tl.channel('scopeU', 0);
  const serviceU = tl.channel('serviceU', 0);
  const opsU = tl.channel('opsU', 0);
  const dimU = tl.channel('dimU', 0);
  const extrasQ = tl.channel('extrasQ', 0); // beat-8 annotations step back
  const endU = tl.channel('endU', 0);

  // 1 — both read an empty record
  tl.caption({ at: 0.5, dur: 10, text: "A bucket can store database pages, but storage alone cannot choose their writer. Imagine both machines reading an empty ownership record, then each declaring itself the room's owner." });
  tl.tween(stageU, 1, { at: B(1) + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(readU, 1, { at: B(1) + 3.0, dur: 4.5, ease: ease.linear });

  // 2 — unconditional uploads overwrite; both are serving
  tl.caption({ at: 11.5, dur: 10, text: 'Ordinary uploads allow the second declaration to overwrite the first. Both machines may already be serving users, even though the bucket currently displays only one of their names.' });
  tl.tween(writeU, 1, { at: B(2) + 0.4, dur: 6.0, ease: ease.linear });
  tl.tween(warnU, 1, { at: B(2) + 6.6, dur: 0.8, ease: ease.enter });

  // 3 — the gap between read and write
  tl.caption({ at: 22.5, dur: 10, text: 'Reading before writing did not make those two steps atomic. The failure is the gap between the read and the write, where another machine can change the answer.' });
  tl.tween(cam, CAM_GAP, { at: B(3) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(gapU, 1, { at: B(3) + 1.2, dur: 5.0, ease: ease.linear });

  // 4 — rewind; replace the upload with a conditional write
  tl.caption({ at: 33.5, dur: 10, text: 'Now replace that ordinary upload with a conditional write. The storage service must accept the change only when the condition still holds at the moment the write takes effect.' });
  tl.tween(rewindU, 1, { at: B(4) + 0.2, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: B(4) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(gapU, 0, { at: B(4) + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(warnU, 0, { at: B(4) + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(writeU, 0, { at: B(4) + 0.8, dur: 2.0, ease: ease.move });
  tl.tween(readU, 0, { at: B(4) + 2.4, dur: 1.4, ease: ease.move });
  tl.tween(rewindU, 0, { at: B(4) + 4.0, dur: 0.6, ease: ease.move });
  tl.tween(latchU, 1, { at: B(4) + 4.4, dur: 1.6, ease: ease.pop });

  // 5 — absent-create race: one wins, the loser learns who won
  tl.caption({ at: 44.5, dur: 10, text: 'For a new record, the condition says that no record exists. When two machines race to create it, one wins; the other must learn who won before it serves the room.' });
  tl.tween(cam, CAM_LATCH, { at: B(5) + 0.1, dur: 1.3, ease: ease.move });
  tl.tween(createU, 1, { at: B(5) + 1.0, dur: 8.0, ease: ease.linear });

  // 6 — version match: a stale version fails; reread
  tl.caption({ at: 55.5, dur: 10, text: 'For an existing record, the contender supplies the version it read. If another writer changed that version, the overwrite fails, and the contender must read again.' });
  tl.tween(matchU, 1, { at: B(6) + 0.6, dur: 8.6, ease: ease.linear });

  // 7 — compare and swap; version is a guard token
  tl.caption({ at: 66.5, dur: 10, text: 'That is compare and swap: one storage operation turns a shared record into a serialization point. The version is a guard token; it need not be a checksum of the database.' });
  tl.tween(cam, CAM_CAS, { at: B(7) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(casU, 1, { at: B(7) + 1.2, dur: 5.0, ease: ease.linear });

  // 8 — workerd's record: node, epoch, from; JS runs on a compute node
  tl.caption({ at: 77.5, dur: 10, text: 'In workerd, the authority record names a node, its epoch, and the last epoch that finished opening. The bucket stores this decision; the Java Script still executes on a compute node.' });
  tl.tween(casU, 0, { at: B(8), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(8) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(recordU, 1, { at: B(8) + 1.0, dur: 5.0, ease: ease.linear });
  tl.tween(pagesU, 1, { at: B(8) + 6.0, dur: 2.0, ease: ease.move });

  // 9 — strong reads
  tl.caption({ at: 88.5, dur: 10, text: 'Strong reads are a separate requirement. After a successful write, a later read must observe the updated record, rather than an obsolete answer from a lagging replica.' });
  tl.tween(extrasQ, 1, { at: B(9), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_READ, { at: B(9) + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(strongU, 1, { at: B(9) + 1.2, dur: 6.0, ease: ease.linear });

  // 10 — speaking S3 is not enough; celld qualifies the store
  tl.caption({ at: 99.5, dur: 10, text: 'An endpoint that speaks the S3 protocol may still ignore these conditions. Celld tests conditional creation, rejected creation, updating, and rejection of a stale update before trusting a store.' });
  tl.tween(strongU, 0, { at: B(10), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_TESTS, { at: B(10) + 0.1, dur: 1.2, ease: ease.move });
  tl.tween(testsU, 1, { at: B(10) + 1.0, dur: 6.5, ease: ease.linear });

  // 11 — one authority key, not a multi-key transaction
  tl.caption({ at: 110.5, dur: 10, text: 'This is a guarantee about one authority key. It does not turn separate objects into one atomic sequel transaction, and it does not make arbitrary bucket operations transactional together.' });
  tl.tween(testsU, 0, { at: B(11), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SCOPE, { at: B(11) + 0.1, dur: 1.4, ease: ease.move });
  tl.tween(scopeU, 1, { at: B(11) + 1.0, dur: 5.0, ease: ease.linear });

  // 12 — the service supplies the primitive; its internals still cost
  tl.caption({ at: 121.5, dur: 10, text: 'We can avoid operating a separate consensus service for this decision because the storage service supplies the required primitive. Its own replication, coordination, failures, and costs still exist.' });
  tl.tween(scopeU, 0, { at: B(12), dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_BUCKET, { at: B(12) + 0.2, dur: 1.6, ease: ease.move });
  tl.tween(serviceU, 1, { at: B(12) + 1.4, dur: 6.0, ease: ease.linear });

  // 13 — operator boundary: a shared durable referee, at a price
  tl.caption({ at: 132.5, dur: 10, text: "The operational simplification is real: our fleet shares a durable referee rather than running another coordination cluster. The price is dependence on that referee's semantics and availability." });
  tl.tween(serviceU, 0, { at: B(13), dur: 0.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: B(13) + 0.1, dur: 1.6, ease: ease.move });
  tl.tween(opsU, 1, { at: B(13) + 1.2, dur: 6.0, ease: ease.linear });

  // 14 — one accepted ownership record
  tl.caption({ at: 143.5, dur: 10, text: "Our room now has one accepted ownership record. Next we must stop yesterday's winner from behaving like today's owner after the record has changed." });
  tl.tween(opsU, 0, { at: B(14), dur: 0.8, ease: ease.move });
  tl.tween(dimU, 1, { at: B(14) + 0.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 640, y: 320, k: 1.05 }, { at: B(14) + 0.4, dur: 1.6, ease: ease.move });
  tl.tween(endU, 1, { at: B(14) + 1.4, dur: 1.0, ease: ease.enter });
  tl.hold(153.5, 0.5);

  return {
    tl, cam, stageU, readU, writeU, warnU, gapU, rewindU, latchU, createU, matchU, casU, recordU,
    pagesU, strongU, testsU, scopeU, serviceU, opsU, dimU, extrasQ, endU,
  };
}

const scene = buildScene();

/* --------------------------------------------------- derived protocol */
interface RecState {
  text: string;
  color: string;
  flash: number;
}
/** What the record shows — a closed-form function of the race channels. */
function recordState(read: number, write: number, create: number, match: number): RecState {
  if (match > 0.42) return { text: 'node: A · version V8', color: POSITIVE, flash: 1 - seg(match, 0.42, 0.52) };
  if (create > 0.3) return { text: 'node: A · version V7', color: POSITIVE, flash: 1 - seg(create, 0.3, 0.4) };
  if (write > 0.72) return { text: 'node: B   (A overwritten)', color: NEGATIVE, flash: 1 - seg(write, 0.72, 0.82) };
  if (write > 0.36) return { text: 'node: A', color: TEXT, flash: 1 - seg(write, 0.36, 0.46) };
  return { text: read > 0 ? '∅  (no record)' : '∅  (no record)', color: MUTED, flash: 0 };
}

/* ------------------------------------------------------ subcomponents */

function Latch({ u, create, match, cas, record }: { u: number; create: number; match: number; cas: number; record: number }) {
  if (u <= 0.001) return null;
  const accept = Math.max(seg(create, 0.22, 0.3) * (1 - seg(create, 0.36, 0.44)), seg(match, 0.34, 0.42) * (1 - seg(match, 0.48, 0.56)));
  const reject = Math.max(seg(create, 0.44, 0.5) * (1 - seg(create, 0.58, 0.66)), seg(match, 0.58, 0.64) * (1 - seg(match, 0.72, 0.8)));
  const ver = match > 0.42 ? 'V8' : create > 0.3 ? 'V7' : '∅';
  const s = clamp01(u);
  const spin = create * 60 + match * 60;
  const ring = reject > 0.05 ? NEGATIVE : accept > 0.05 ? POSITIVE : WARM;
  return (
    <g transform={`translate(${LATCH.x}, ${LATCH.y}) scale(${0.6 + 0.4 * s})`} opacity={s}>
      <g transform={`rotate(${spin})`}>
        {TEETH.map((a, i) => (
          <rect key={i} x={-5} y={-LATCH.r - 10} width={10} height={14} rx={2} fill={ring} transform={`rotate(${(a * 180) / Math.PI})`} />
        ))}
      </g>
      <circle r={LATCH.r} fill={PANEL} stroke={ring} strokeWidth={4} />
      {/* version socket */}
      <rect x={-38} y={-20} width={76} height={40} rx={8} fill={colors.BG} stroke={ring} strokeWidth={2} />
      <text y={8} textAnchor="middle" fill={ring} fontSize={22} fontFamily={MONO} fontWeight={700}>
        {ver}
      </text>
      {/* the bolt drops on rejection */}
      <rect x={-LATCH.r - 18} y={-6 + 0} width={(LATCH.r + 18) * 2} height={12} rx={6} fill={NEGATIVE} opacity={reject} />
      <text y={-LATCH.r - 22} textAnchor="middle" fill={MUTED} fontSize={18} fontFamily={MONO} opacity={(1 - seg(cas, 0, 0.3)) * (1 - seg(record, 0, 0.2))}>
        own.json only
      </text>
    </g>
  );
}

function RecordCard({ st, record }: { st: RecState; record: number }) {
  const wide = seg(record, 0, 0.25);
  const w = CARD.w;
  return (
    <g transform={`translate(${CARD.x}, ${CARD.y})`}>
      <rect x={-w / 2} y={-CARD.h / 2} width={w} height={CARD.h} rx={10} fill={colors.BG} stroke={st.color} strokeWidth={2.4} />
      <rect x={-w / 2} y={-CARD.h / 2} width={w} height={CARD.h} rx={10} fill={st.color} opacity={0.22 * st.flash} />
      <text y={-CARD.h / 2 + 30 - 6 * wide} textAnchor="middle" fill={MUTED} fontSize={18} fontFamily={MONO}>
        {KEY}
      </text>
      <g opacity={1 - wide}>
        <text y={22} textAnchor="middle" fill={st.color} fontSize={22} fontFamily={MONO} fontWeight={700}>
          {st.text}
        </text>
      </g>
      <g opacity={wide}>
        <text y={10} textAnchor="middle" fill={TEXT} fontSize={18} fontFamily={MONO}>
          OwnerRecord {'{'} node, epoch, from {'}'}
        </text>
        <text y={37} textAnchor="middle" fill={POSITIVE} fontSize={20} fontFamily={MONO} fontWeight={700}>
          node: A · epoch: 7 · from: 7
        </text>
      </g>
    </g>
  );
}

function Stamp({ x, text, color, u }: { x: number; text: string; color: string; u: number }) {
  return <Pill x={x} y={222} text={text} color={color} size={18} opacity={u} bold />;
}

function Packet({ pts, u, text, color }: { pts: P[]; u: number; text: string; color: string }) {
  if (u <= 0 || u >= 1) return null;
  const p = along(pts, ease.move(u));
  return <Pill x={p.x} y={p.y} text={text} color={color} size={18} mono />;
}

/** The naive race (beats 1–3): reads return ∅, unconditional PUTs overwrite. */
function NaiveRace({ read, write }: { read: number; write: number }) {
  const rA = seg(read, 0.1, 0.5);
  const rB = seg(read, 0.35, 0.75);
  return (
    <g>
      <Packet pts={[...DIRECT_A].reverse()} u={rA} text="read → ∅" color={MUTED} />
      <Packet pts={[...DIRECT_B].reverse()} u={rB} text="read → ∅" color={MUTED} />
      <Packet pts={DIRECT_A} u={seg(write, 0.05, 0.36)} text="PUT own.json" color={ACCENT} />
      <Packet pts={DIRECT_B} u={seg(write, 0.42, 0.72)} text="PUT own.json" color={SECONDARY} />
    </g>
  );
}

/** Read→write gap lane (beat 3): B's write lands inside A's window. */
function GapLane({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const X0 = 400;
  const X1 = 880;
  const y = 232;
  const a = seg(u, 0, 0.3);
  const b = seg(u, 0.3, 0.6);
  const c = seg(u, 0.6, 1);
  return (
    <g opacity={clamp01(u * 5)}>
      <rect x={X0 - 70} y={y - 46} width={X1 - X0 + 140} height={120} rx={12} fill={colors.BG} stroke={MUTED} strokeWidth={1.2} />
      <line x1={X0} y1={y} x2={lerp(X0, X1, a)} y2={y} stroke={ACCENT} strokeWidth={3} />
      <circle cx={X0} cy={y} r={7} fill={ACCENT} />
      <Label x={X0} y={y - 18} text="A reads ∅" color={ACCENT} size={18} />
      <circle cx={X1} cy={y} r={7} fill={ACCENT} opacity={a} />
      <Label x={X1} y={y - 18} text="A writes" color={ACCENT} size={18} opacity={a} />
      <rect x={X0 + 10} y={y - 8} width={(X1 - X0 - 20) * b} height={16} fill={NEGATIVE} opacity={0.22} />
      <line x1={640} y1={y - 26} x2={640} y2={y + 14} stroke={NEGATIVE} strokeWidth={3} opacity={c} />
      <Label x={640} y={y + 40} text="B can write inside the gap" color={NEGATIVE} size={18} opacity={c} bold />
      <Label x={640} y={y - 18} text="gap" color={NEGATIVE} size={18} opacity={b} />
    </g>
  );
}

/** Conditional races (beats 5–6). */
function CasRace({ create, match }: { create: number; match: number }) {
  // beat 5 — If-None-Match: *
  const aIn = seg(create, 0.02, 0.22);
  const bIn = seg(create, 0.08, 0.44);
  const aThrough = seg(create, 0.22, 0.3);
  const bBounce = seg(create, 0.5, 0.62);
  const bRead = seg(create, 0.62, 0.8);
  const bRoute = seg(create, 0.82, 0.98);
  // beat 6 — If-Match
  const mA = seg(match, 0.12, 0.34);
  const mB = seg(match, 0.2, 0.58);
  const mAThrough = seg(match, 0.34, 0.42);
  const mBBounce = seg(match, 0.64, 0.74);
  const mReread = seg(match, 0.76, 0.96);
  const back = (pts: P[]) => [...pts].reverse();
  return (
    <g>
      <Packet pts={VIA_A} u={aIn} text="If-None-Match: *" color={ACCENT} />
      <Packet pts={VIA_B} u={bIn} text="If-None-Match: *" color={SECONDARY} />
      <Packet pts={THROUGH} u={aThrough} text="create" color={POSITIVE} />
      <Packet pts={back(VIA_B)} u={bBounce} text="rejected: exists" color={NEGATIVE} />
      <Packet pts={[{ x: CARD.x + 200, y: CARD.y }, { x: HB.x - 40, y: HB.y + 30 }]} u={bRead} text="read → owner A" color={MUTED} />
      {bRoute > 0 ? (
        <g opacity={bRoute * (1 - seg(match, 0, 0.1))}>
          <path d={`M ${HB.x - 50} ${HB.y - 40} Q 640 120 ${HA.x + 50} ${HA.y - 40}`} fill="none" stroke={SECONDARY} strokeWidth={2.4} strokeDasharray="8 6" />
          <Pill x={640} y={168} text="B routes lobby requests to A" color={SECONDARY} size={18} />
        </g>
      ) : null}
      <Packet pts={VIA_A} u={mA} text="If-Match: V7" color={ACCENT} />
      <Packet pts={VIA_B} u={mB} text="If-Match: V7" color={SECONDARY} />
      <Packet pts={THROUGH} u={mAThrough} text="V7 → V8" color={POSITIVE} />
      <Packet pts={back(VIA_B)} u={mBBounce} text="rejected: now V8" color={NEGATIVE} />
      <Packet pts={[{ x: CARD.x + 200, y: CARD.y }, { x: HB.x - 40, y: HB.y + 30 }]} u={mReread} text="read again → V8" color={MUTED} />
    </g>
  );
}

function CasDefinition({ u }: { u: number }) {
  if (u <= 0.001) return null;
  return (
    <g>
      <MathLabel tex={'\\mathrm{CAS}(\\text{key},\\ v_{\\text{read}} \\rightarrow v_{\\text{new}})\\ \\text{succeeds iff current} = v_{\\text{read}}'} x={640} y={104} fontSize={24} opacity={seg(u, 0, 0.2)} />
      <Pill x={640} y={152} text="Guard::Absent → If-None-Match: *" color={ACCENT} size={18} mono opacity={seg(u, 0.2, 0.35)} />
      <Pill x={640} y={196} text="Guard::Match(version) → If-Match: <version>" color={SECONDARY} size={18} mono opacity={seg(u, 0.35, 0.5)} />
      <Pill x={LATCH.x + 80} y={LATCH.y + 2} text="version = guard token, not a checksum" color={WARM} size={18} anchor="start" opacity={seg(u, 0.6, 0.8)} fill={colors.BG} />
    </g>
  );
}

function RecordExtras({ record, pages, quiet, jsFit }: { record: number; pages: number; quiet: number; jsFit: number }) {
  const js = seg(record, 0.45, 0.75) * (1 - quiet);
  return (
    <g>
      <g opacity={js * jsFit}>
        <path d={`M ${CARD.x - CARD.w / 2} ${CARD.y - CARD.h / 2 + 6} Q 330 380 ${HA.x + 20} ${HA.y + 70}`} fill="none" stroke={ACCENT} strokeWidth={2.2} strokeDasharray="6 6" />
        <Pill x={HA.x} y={HA.y + 120} text="JavaScript runs here" color={ACCENT} size={18} />
      </g>
      <Pill x={CARD.x} y={586} text="the bucket stores the decision" color={TEAL} size={18} fill={colors.BG} opacity={js} />
      {pages > 0.001 ? (
        <g opacity={1 - quiet}>
          {['log/…', 'snapshot/…'].map((t, i) => {
            const p = seg(pages, i * 0.2, 0.8 + i * 0.2);
            return <Pill key={t} x={lerp(1120, 560 + i * 170, ease.move(p))} y={524} text={t} color={MUTED} size={18} mono opacity={0.9 * seg(p, 0, 0.3)} />;
          })}
        </g>
      ) : null}
    </g>
  );
}

function StrongRead({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const fly = seg(u, 0.1, 0.45);
  const ghost = seg(u, 0.5, 0.65);
  const strike = seg(u, 0.65, 0.8);
  return (
    <g>
      <Packet pts={[{ x: CARD.x + 200, y: CARD.y }, { x: HB.x - 40, y: HB.y + 40 }]} u={fly} text="later read → V8 ✓" color={POSITIVE} />
      <g opacity={fly >= 1 ? 1 : 0}>
        <Pill x={HB.x} y={HB.y + 104} text="V8 ✓" color={POSITIVE} size={20} mono bold />
      </g>
      <g opacity={ghost}>
        <Pill x={1060} y={462} text="V7 from lagging replica" color={NEGATIVE} size={18} mono />
        <line x1={928} y1={462} x2={928 + 264 * strike} y2={462} stroke={NEGATIVE} strokeWidth={3} />
        <Label x={1230} y={512} text="reads must see the latest write" color={TEXT} size={18} anchor="end" opacity={strike} />
      </g>
    </g>
  );
}

function StoreTests({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const rows = ['conditional create', 'rejected create', 'update', 'stale update rejected'];
  return (
    <g opacity={clamp01(u * 6)}>
      <rect x={880} y={372} width={360} height={232} rx={14} fill={colors.BG} stroke={TEAL} strokeWidth={2} />
      <Label x={900} y={404} text="celld checks a store first" color={TEAL} size={20} anchor="start" bold />
      <Label x={900} y={432} text="speaking S3 ≠ honoring conditions" color={MUTED} size={18} anchor="start" />
      {rows.map((r, i) => {
        const v = seg(u, 0.15 + i * 0.15, 0.27 + i * 0.15);
        return (
          <g key={r} opacity={0.35 + 0.65 * v}>
            <rect x={900} y={450 + i * 36} width={24} height={24} rx={5} fill="none" stroke={POSITIVE} strokeWidth={2} />
            <path d={`M ${905} ${462 + i * 36} l 6 7 l 10 -14`} fill="none" stroke={POSITIVE} strokeWidth={3} opacity={v} />
            <Label x={936} y={469 + i * 36} text={r} color={TEXT} size={18} anchor="start" />
          </g>
        );
      })}
    </g>
  );
}

function Scope({ u }: { u: number }) {
  if (u <= 0.001) return null;
  return (
    <g>
      <Pill x={LATCH.x + 90} y={LATCH.y} text="guarantee: one authority key" color={POSITIVE} size={18} anchor="start" opacity={seg(u, 0, 0.2)} fill={colors.BG} />
      <g opacity={seg(u, 0.3, 0.5)}>
        <Pill x={300} y={530} text="do/ns/other/own.json" color={MUTED} size={18} mono />
        <rect x={150} y={420} width={980} height={150} rx={18} fill="none" stroke={NEGATIVE} strokeWidth={2.4} strokeDasharray="10 7" />
      </g>
      <Pill x={640} y={586} text="✗ not one atomic transaction across keys" color={NEGATIVE} size={18} opacity={seg(u, 0.55, 0.75)} fill={colors.BG} />
    </g>
  );
}

function ServiceInterior({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const draw = seg(u, 0.35, 0.8);
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const f = i / 80;
    if (f > draw) break;
    const x = 450 + f * 380;
    const y = 520 - 18 * Math.sin(f * 14) * Math.exp(-((f - 0.55) ** 2) * 6) - (f > 0.62 && f < 0.7 ? 22 : 0);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <g opacity={clamp01(u * 5)}>
      <rect x={BKT.x - 220} y={410} width={440} height={150} rx={14} fill="#05070d" stroke={TEAL} strokeWidth={2} />
      <Label x={BKT.x} y={440} text="storage service internals (opaque)" color={TEAL} size={18} bold />
      <Label x={BKT.x} y={466} text="replication · coordination · failures · costs" color={TEXT} size={18} opacity={seg(u, 0.15, 0.3)} />
      <polyline points={pts.join(' ')} fill="none" stroke={WARM} strokeWidth={2.4} />
      <Label x={BKT.x} y={552} text="latency / cost: illustrative shape" color={MUTED} size={16} opacity={draw} />
    </g>
  );
}

function OperatorBoundary({ u }: { u: number }) {
  if (u <= 0.001) return null;
  const out = seg(u, 0.25, 0.6);
  return (
    <g>
      <g opacity={seg(u, 0, 0.2)}>
        <rect x={70} y={190} width={1140} height={200} rx={20} fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="10 8" />
        <Label x={90} y={180} text="your operator boundary" color={ACCENT} size={18} anchor="start" bold />
      </g>
      <g transform={`translate(0, ${-170 * out})`} opacity={seg(u, 0.05, 0.2) * (1 - 0.85 * out)}>
        <rect x={290} y={272} width={250} height={58} rx={10} fill={PANEL} stroke={MUTED} strokeWidth={1.6} />
        {[315, 345, 375].map((x) => (
          <circle key={x} cx={x} cy={301} r={9} fill="none" stroke={MUTED} strokeWidth={2} />
        ))}
        <Label x={462} y={308} text="coord. cluster" color={MUTED} size={18} />
        <line x1={295} y1={277} x2={535} y2={325} stroke={NEGATIVE} strokeWidth={3} opacity={seg(u, 0.15, 0.25)} />
      </g>
      <Pill x={820} y={140} text="no separate coordination cluster to run" color={POSITIVE} size={18} opacity={seg(u, 0.45, 0.6)} fill={colors.BG} />
      <Pill x={640} y={586} text="price: depend on the referee's semantics + availability" color={WARM} size={18} opacity={seg(u, 0.6, 0.8)} fill={colors.BG} />
    </g>
  );
}

/* --------------------------------------------------------------- frame */
export function Render({ s }: { s: SceneState }) {
  const stage = s.get(scene.stageU);
  const read = s.get(scene.readU);
  const write = s.get(scene.writeU);
  const create = s.get(scene.createU);
  const match = s.get(scene.matchU);
  const latch = s.get(scene.latchU);
  const cas = s.get(scene.casU);
  const record = s.get(scene.recordU);
  const service = s.get(scene.serviceU);
  const dim = s.get(scene.dimU);
  const st = recordState(read, write, create, match);
  const base = 1 - 0.9 * dim;
  const cam = s.get(scene.cam);
  const strong = s.get(scene.strongU);
  const fitA = fit(cam, HA.x - 80, HA.x + 80, 204, 362);
  const fitB = fit(cam, HB.x - 80, HB.x + 80, 204, 362);
  // ownership stamps: who believes it owns lobby
  const naiveA = seg(write, 0.36, 0.42);
  const naiveB = seg(write, 0.72, 0.78);
  const casA = seg(create, 0.3, 0.36);
  const owners = Math.round(naiveA + naiveB);
  const counterOp = seg(create, 0.86, 0.95) * (1 - cas);
  return (
    <>
      <Backdrop />
      <Camera {...cam}>
        <g opacity={stage * base}>
          <Bucket x={BKT.x} y={BKT.y} w={BKT.w} h={BKT.h} label="" opacity={1} />
          <Label x={BKT.x - BKT.w / 2 - 16} y={BKT.y + 6} text="bucket" color={TEAL} size={20} anchor="end" bold opacity={fit(cam, BKT.x - BKT.w / 2 - 90, BKT.x - BKT.w / 2 - 10, BKT.y - 14, BKT.y + 12)} />
          <g opacity={1 - 0.9 * clamp01(service * 3)}>
            <RecordCard st={st} record={record} />
          </g>
          <g opacity={fitA}>
            <Host x={HA.x} y={HA.y} label="host A" color={ACCENT} />
            <Stamp x={HA.x} text="✓ I own lobby" color={POSITIVE} u={Math.max(naiveA, casA)} />
          </g>
          <g opacity={fitB}>
            <Host x={HB.x} y={HB.y} label="host B" color={SECONDARY} />
            <Stamp x={HB.x} text="✓ I own lobby" color={POSITIVE} u={naiveB} />
          </g>
          <g opacity={fit(cam, LATCH.x - 70, LATCH.x + 70, LATCH.y - 70, LATCH.y + 100)}>
            <Latch u={latch} create={create} match={match} cas={cas} record={record} />
          </g>
          <NaiveRace read={read} write={write} />
          <CasRace create={create} match={match} />
          <Pill x={640} y={92} text="owners serving lobby: 1" color={POSITIVE} size={20} bold opacity={counterOp * (1 - seg(record, 0, 0.1))} />
          <RecordExtras record={record} pages={s.get(scene.pagesU)} quiet={s.get(scene.extrasQ)} jsFit={fit(cam, HA.x - 110, HA.x + 110, HA.y + 100, HA.y + 140)} />
          <StrongRead u={strong} />
          <StoreTests u={s.get(scene.testsU)} />
          <Scope u={s.get(scene.scopeU)} />
          <ServiceInterior u={service} />
          <OperatorBoundary u={s.get(scene.opsU)} />
        </g>
        <WarnCard
          x={640}
          y={66}
          w={600}
          title="naive protocol — incorrect"
          lines={['both read ∅, then PUT without a condition', `invariant broken: owners serving lobby = ${owners}`]}
          opacity={s.get(scene.warnU) * base}
        />
        <GapLane u={s.get(scene.gapU) * base} />
        <Pill x={640} y={300} text="⟲ rewind" color={WARM} size={24} bold opacity={s.get(scene.rewindU)} fill={colors.BG} />
        <CasDefinition u={cas} />
        <Takeaway
          u={s.get(scene.endU)}
          y={320}
          title="One accepted ownership record"
          lines={[
            { text: KEY, color: MUTED, mono: true },
            { text: '{ node: A, epoch: 7, from: 7 }', color: POSITIVE, mono: true },
            { text: 'owners serving lobby: 1', color: POSITIVE },
            { text: "next: stop yesterday's winner", color: WARM },
          ]}
          foot="illustrative values · conditional write on one key"
        />
      </Camera>
      {/* screen-space footer: never moves with the camera, stays above the caption band */}
      <Illus x={60} y={620} opacity={stage * base} text="lobby, hosts, V7/V8, record values: illustrative · key schema real" />
    </>
  );
}

export const vizScene = () => scene;
