// Down the WAL: Postgres write → shape logs
//
// Grounding: packages/sync-service/lib/electric/postgres/replication_client.ex
// (steps :create_publication → :create_slot → :start_streaming),
// postgres/logical_replication/decoder.ex + messages.ex (Begin / Relation /
// Insert / Update / Delete / Commit), replication_client/message_converter.ex
// (→ Changes.Transaction), replication/shape_log_collector.ex ("when any txn
// comes from postgres, we need to store it into the log for this shape iff…";
// processor + RequestBatcher), shapes/filter/where_condition.ex (the shape
// matching index), shapes/consumer.ex (one consumer per shape handle),
// shape_log_collector/flush_tracker.ex (acks the flushed LSN back).
//
// Centerpiece: an assembly line running right-to-left from Postgres — a
// sealed WAL envelope is decoded into begin/update/commit, packed into a
// Transaction capsule, and dropped into the ShapeLogCollector sieve, which
// fans it across every registered shape's where-clause at once. Only the
// matching lane lights; its consumer appends one entry to OUR tape from
// chapter two, leaving the client's playhead visibly behind.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — Postgres right, stations marching left, shape lanes at the bottom.
// ---------------------------------------------------------------------------

const PG = { x: 1080, y: 150 } as const;
const CONVEY_Y = 232;
const ST_A = { x: 760, y: CONVEY_Y - 40, w: 200, h: 84 } as const; // ReplicationClient
const ST_B = { x: 500, y: CONVEY_Y - 40, w: 190, h: 84 } as const; // MessageConverter
const SIEVE = { x: 210, y: CONVEY_Y - 44, w: 220, h: 96 } as const; // ShapeLogCollector

const LANES = [
  { y: 420, handle: '90233815-…', label: "todos · project_id = 'p2'", ours: false },
  { y: 472, handle: '31207944-…', label: 'users', ours: false },
  { y: 524, handle: '62488107-…', label: "todos · project_id = 'p1'", ours: true },
] as const;
const OUR_LANE_Y = LANES[2].y;
const LANE_X0 = 96;
const TAPE_X0 = 380;
const TAPE_X1 = 1170;
const TAPE_H = 24;
const SEG_W = 58;
const segX = (i: number): number => TAPE_X0 + 16 + i * (SEG_W + 5);

/** Piecewise-linear travel along waypoints, u in 0..1. */
function along(pts: { x: number; y: number }[], u: number): { x: number; y: number } {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
  };
}

// envelope: out of Postgres, along the conveyor, into station A
const ENV_PATH = [
  { x: PG.x - 60, y: PG.y + 40 },
  { x: PG.x - 110, y: CONVEY_Y },
  { x: ST_A.x + ST_A.w + 24, y: CONVEY_Y },
];
// glyphs: station A → station B
const GLYPH_PATH = [
  { x: ST_A.x - 14, y: CONVEY_Y },
  { x: ST_B.x + ST_B.w + 16, y: CONVEY_Y },
];
// capsule: station B → sieve
const CAP_PATH = [
  { x: ST_B.x - 14, y: CONVEY_Y },
  { x: SIEVE.x + SIEVE.w + 16, y: CONVEY_Y },
];

// the fan: sieve bottom → each lane's gate
const SIEVE_OUT = { x: SIEVE.x + SIEVE.w / 2, y: SIEVE.y + SIEVE.h + 4 };
const gatePos = (li: number) => ({ x: TAPE_X0 - 34, y: LANES[li].y + TAPE_H / 2 });

// snapshot state of OUR tape (from chapter two)
const SNAP_SEGS = ['0_0', '0_1', '0_2', '0_3'] as const;
const NEW_SEG_I = 4;

// camera marks
const CAM_PG: CameraState = { x: 980, y: 220, k: 1.25 };
const CAM_LINE: CameraState = { x: 640, y: 250, k: 1.1 };
const CAM_SIEVE: CameraState = { x: 380, y: 360, k: 1.28 };
const CAM_TAPE: CameraState = { x: 660, y: 440, k: 1.22 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline (~97s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PG, cameraInterp);

  const pgU = tl.channel('pgU', 0); // Postgres node
  const writeU = tl.channel('writeU', 0); // the UPDATE chip + commit ring
  const walU = tl.channel('walU', 0); // the write-ahead log spool bar
  const stAU = tl.channel('stAU', 0); // ReplicationClient station
  const envU = tl.channel('envU', 0); // sealed envelope travels PG → station A
  const decodeU = tl.channel('decodeU', 0); // envelope cracks into 3 glyphs
  const glyphU = tl.channel('glyphU', 0); // glyphs travel A → B
  const stBU = tl.channel('stBU', 0); // MessageConverter station
  const capU = tl.channel('capU', 0); // Transaction capsule forms
  const capMoveU = tl.channel('capMoveU', 0); // capsule travels B → sieve
  const sieveU = tl.channel('sieveU', 0); // ShapeLogCollector sieve
  const lanesU = tl.channel('lanesU', 0); // the three shape lanes
  const fanU = tl.channel('fanU', 0); // three test probes fan out
  const verdictU = tl.channel('verdictU', 0); // ✓ / ✗ / ✗ verdicts land
  const appendU = tl.channel('appendU', 0); // the new segment appends to our tape
  const ackU = tl.channel('ackU', 0); // FlushTracker ack arc back to Postgres
  const gapU = tl.channel('gapU', 0); // the playhead-vs-head gap brace

  // — beat 1 · a plain write —
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Meanwhile, on the write side, somebody finishes the task. A plain update statement — no Electric client anywhere in sight.',
  });
  tl.tween(pgU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.tween(writeU, 1, { at: 2.2, dur: 0.9, ease: ease.pop });
  tl.hold(6.3, 0.6);

  // — beat 2 · the write-ahead log —
  tl.caption({
    at: 6.9,
    dur: 5.8,
    text: 'Postgres records every committed change in its write-ahead log before anyone else hears about it. That log is where Electric taps in.',
  });
  tl.tween(walU, 1, { at: 7.5, dur: 1.4, ease: ease.draw });
  tl.hold(12.7, 0.6);

  // — beat 3 · the replication client —
  tl.caption({
    at: 13.3,
    dur: 6.4,
    text: 'Electric connects as a logical replication client. It creates a publication and a replication slot, and Postgres starts streaming changes to it.',
  });
  tl.tween(cam, CAM_LINE, { at: 13.5, dur: 1.4, ease: ease.move });
  tl.tween(stAU, 1, { at: 14.1, dur: 1.0, ease: ease.enter });
  tl.tween(envU, 1, { at: 15.6, dur: 1.8, ease: ease.linear });
  tl.hold(19.7, 0.6);

  // — beat 4 · the decoder —
  tl.caption({
    at: 20.3,
    dur: 5.6,
    text: 'Each message arrives as a sealed binary envelope. A decoder cracks it open: begin — the changed row — commit.',
  });
  tl.tween(decodeU, 1, { at: 20.9, dur: 1.6, ease: ease.move });
  tl.hold(25.9, 0.6);

  // — beat 5 · the converter → one transaction —
  tl.caption({
    at: 26.5,
    dur: 5.8,
    text: 'A converter gathers the pieces into a single transaction: the new row values, tagged with the transaction identifier.',
  });
  tl.tween(stBU, 1, { at: 26.9, dur: 0.9, ease: ease.enter });
  tl.tween(glyphU, 1, { at: 27.5, dur: 1.4, ease: ease.linear });
  tl.tween(capU, 1, { at: 29.1, dur: 0.9, ease: ease.pop });
  tl.hold(32.3, 0.6);

  // — beat 6 · the collector: one narrow doorway —
  tl.caption({
    at: 32.9,
    dur: 6.0,
    text: 'That transaction lands at the shape log collector — the one narrow doorway every change in the whole system walks through.',
  });
  tl.tween(sieveU, 1, { at: 33.3, dur: 1.0, ease: ease.enter });
  tl.tween(capMoveU, 1, { at: 34.3, dur: 1.4, ease: ease.linear });
  tl.tween(cam, CAM_SIEVE, { at: 34.7, dur: 1.4, ease: ease.move });
  tl.hold(38.9, 0.6);

  // — beat 7 · the fan-out —
  tl.caption({
    at: 39.5,
    dur: 6.4,
    text: 'Here is the fan-out. The collector keeps an index of every registered shape’s where clause, and it tests the changed row against all of them at once.',
  });
  tl.tween(lanesU, 1, { at: 39.9, dur: 1.6, ease: ease.draw });
  tl.tween(fanU, 1, { at: 41.9, dur: 1.8, ease: ease.linear });
  tl.hold(45.9, 0.6);

  // — beat 8 · the verdicts —
  tl.caption({
    at: 46.5,
    dur: 6.2,
    text: 'Our row belongs to project one, so our shape matches. The project two shape fails the test, and the users shape is a different table entirely.',
  });
  tl.tween(cam, CAM_TAPE, { at: 46.7, dur: 1.4, ease: ease.move });
  tl.tween(verdictU, 1, { at: 47.3, dur: 1.8, ease: ease.move });
  tl.hold(52.7, 0.6);

  // — beat 9 · the consumer appends —
  tl.caption({
    at: 53.3,
    dur: 6.0,
    text: 'Every matching shape has a consumer process, and the consumer appends the change to that shape’s log. Our tape grows by exactly one entry.',
  });
  tl.tween(appendU, 1, { at: 54.1, dur: 1.6, ease: ease.move });
  tl.hold(59.3, 0.6);

  // — beat 10 · the ack —
  tl.caption({
    at: 59.9,
    dur: 5.4,
    text: 'A flush tracker then acknowledges the position back to Postgres, so the replication slot can safely move forward.',
  });
  tl.tween(cam, CAM_WIDE, { at: 60.1, dur: 1.4, ease: ease.move });
  tl.tween(ackU, 1, { at: 60.9, dur: 1.8, ease: ease.linear });
  tl.hold(65.3, 0.6);

  // — beat 11 · the gap —
  tl.caption({
    at: 65.9,
    dur: 7.0,
    text: 'Now look closely at the tape. The log is ahead, and the client’s playhead is still behind. That gap is one update wide — and closing it is the next chapter.',
  });
  tl.tween(cam, CAM_TAPE, { at: 66.3, dur: 1.4, ease: ease.move });
  tl.tween(gapU, 1, { at: 67.3, dur: 1.2, ease: ease.move });
  tl.hold(72.9, 1.5);

  return {
    tl,
    cam,
    pgU,
    writeU,
    walU,
    stAU,
    envU,
    decodeU,
    glyphU,
    stBU,
    capU,
    capMoveU,
    sieveU,
    lanesU,
    fanU,
    verdictU,
    appendU,
    ackU,
    gapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Station({
  box,
  title,
  file,
  u,
}: {
  box: { x: number; y: number; w: number; h: number };
  title: string;
  file: string;
  u: number;
}) {
  return (
    <g opacity={u}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
      <text x={box.x + box.w / 2} y={box.y + 26} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600} fontFamily={MONO}>
        {title}
      </text>
      <text x={box.x + box.w / 2} y={box.y + 46} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        {file}
      </text>
    </g>
  );
}

const GLYPHS = [
  { label: 'Begin', color: colors.MUTED },
  { label: 'Update', color: colors.WARM },
  { label: 'Commit', color: colors.POSITIVE },
] as const;

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pgU = s.get(scene.pgU);
  const writeU = s.get(scene.writeU);
  const walU = s.get(scene.walU);
  const stAU = s.get(scene.stAU);
  const envU = s.get(scene.envU);
  const decodeU = s.get(scene.decodeU);
  const glyphU = s.get(scene.glyphU);
  const stBU = s.get(scene.stBU);
  const capU = s.get(scene.capU);
  const capMoveU = s.get(scene.capMoveU);
  const sieveU = s.get(scene.sieveU);
  const lanesU = s.get(scene.lanesU);
  const fanU = s.get(scene.fanU);
  const verdictU = s.get(scene.verdictU);
  const appendU = s.get(scene.appendU);
  const ackU = s.get(scene.ackU);
  const gapU = s.get(scene.gapU);

  const envPos = along(ENV_PATH, envU);
  const capPos = along(CAP_PATH, capMoveU);
  const phX = segX(3) + SEG_W; // the client's playhead — parked at the end of the snapshot
  const headX = segX(NEW_SEG_I) + SEG_W * appendU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ------------------------------------------------ Postgres + the write */}
        <g opacity={pgU}>
          <ServiceNode x={PG.x} y={PG.y} kind="db" label="Postgres" sublabel="public.todos" u={pgU} glow={writeU * (1 - envU)} />
        </g>
        <g opacity={writeU}>
          <rect x={PG.x - 260} y={PG.y - 116} width={420} height={30} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
          <text x={PG.x - 50} y={PG.y - 96} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
            {"UPDATE todos SET status='done' WHERE id=41"}
          </text>
          <line x1={PG.x - 50} y1={PG.y - 84} x2={PG.x - 10} y2={PG.y - 40} stroke={colors.WARM} strokeWidth={1.3} opacity={0.7} />
        </g>
        {/* the WAL spool bar under Postgres */}
        <g opacity={walU * pgU}>
          <rect x={PG.x - 130} y={PG.y + 52} width={220} height={16} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={PG.x - 126 + i * 36} y={PG.y + 55} width={28} height={10} rx={3} fill="rgba(251,191,36,0.25)" stroke={colors.WARM} strokeWidth={0.8} opacity={walU} />
          ))}
          <text x={PG.x - 130} y={PG.y + 86} fill={colors.MUTED} fontSize={11}>
            write-ahead log
          </text>
        </g>

        {/* ------------------------------------------------ the stations */}
        <Station box={ST_A} title="ReplicationClient" file="create_slot → start_streaming" u={stAU} />
        <Station box={ST_B} title="MessageConverter" file="→ %Changes.Transaction{}" u={stBU} />
        <g opacity={sieveU}>
          <rect x={SIEVE.x} y={SIEVE.y} width={SIEVE.w} height={SIEVE.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={SIEVE.x + SIEVE.w / 2} y={SIEVE.y + 28} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600} fontFamily={MONO}>
            ShapeLogCollector
          </text>
          <text x={SIEVE.x + SIEVE.w / 2} y={SIEVE.y + 48} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
            shape_log_collector.ex
          </text>
          <text x={SIEVE.x + SIEVE.w / 2} y={SIEVE.y + 72} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5}>
            where-clause index · every shape at once
          </text>
        </g>

        {/* ------------------------------------------------ the traveling envelope */}
        {envU > 0.01 && envU < 0.99 && (
          <g>
            <rect x={envPos.x - 26} y={envPos.y - 15} width={52} height={30} rx={5} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.4} />
            <path d={`M ${envPos.x - 26} ${envPos.y - 15} L ${envPos.x} ${envPos.y + 2} L ${envPos.x + 26} ${envPos.y - 15}`} fill="none" stroke={colors.WARM} strokeWidth={1.2} />
            <text x={envPos.x} y={envPos.y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
              binary
            </text>
          </g>
        )}

        {/* the decoded glyphs — appear at station A, travel to station B */}
        {decodeU > 0.02 && capU < 0.98 && (
          <g>
            {GLYPHS.map((gl, i) => {
              const spread = decodeU * (i - 1) * 34;
              const start = { x: ST_A.x + ST_A.w / 2 + spread, y: CONVEY_Y + decodeU * 0 };
              const end = { x: ST_B.x + ST_B.w / 2 + (i - 1) * 30, y: CONVEY_Y };
              const p = {
                x: start.x + (end.x - start.x) * glyphU,
                y: start.y + (end.y - start.y) * glyphU,
              };
              return (
                <g key={gl.label} opacity={(1 - capU) * clamp01(decodeU * 2)}>
                  <rect x={p.x - 26} y={p.y - 12} width={52} height={24} rx={6} fill={colors.BG} stroke={gl.color} strokeWidth={1.2} />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fill={gl.color} fontSize={10} fontFamily={MONO}>
                    {gl.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* the Transaction capsule */}
        {capU > 0.02 && (
          <g opacity={capU} transform={`translate(${capPos.x}, ${capPos.y})`}>
            <rect x={-58} y={-20} width={116} height={40} rx={18} fill="rgba(251,191,36,0.12)" stroke={colors.WARM} strokeWidth={1.6} />
            <text x={0} y={-3} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
              Transaction
            </text>
            <text x={0} y={12} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              xid=771 · id=41→done
            </text>
          </g>
        )}

        {/* ------------------------------------------------ the three shape lanes */}
        {LANES.map((lane, li) => {
          const laneU = win(lanesU, 3, li, 1.6);
          const verdict = win(verdictU, 3, li, 1.4);
          const pass = lane.ours;
          return (
            <g key={lane.handle} opacity={laneU}>
              {/* label chip */}
              <rect x={LANE_X0} y={lane.y - 4} width={262} height={TAPE_H + 8} rx={8} fill={colors.PANEL} stroke={pass && verdict > 0.5 ? colors.ACCENT : colors.GRID} />
              <text x={LANE_X0 + 12} y={lane.y + 11} fill={pass ? colors.ACCENT : colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                {lane.handle}
              </text>
              <text x={LANE_X0 + 12} y={lane.y + 24} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                {lane.label}
              </text>
              {/* the tape */}
              <rect
                x={TAPE_X0}
                y={lane.y}
                width={TAPE_X1 - TAPE_X0}
                height={TAPE_H}
                rx={6}
                fill={colors.PANEL}
                stroke={colors.GRID}
                opacity={pass ? 1 : 0.55}
              />
              {/* our lane carries the chapter-two snapshot */}
              {lane.ours && (
                <g>
                  {SNAP_SEGS.map((off, i) => (
                    <g key={off}>
                      <rect x={segX(i)} y={lane.y + 3} width={SEG_W} height={TAPE_H - 6} rx={4} fill="rgba(56,189,248,0.18)" stroke={colors.ACCENT} strokeWidth={0.9} />
                      <text x={segX(i) + SEG_W / 2} y={lane.y + TAPE_H + 14} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
                        {off}
                      </text>
                    </g>
                  ))}
                  {/* the new appended entry */}
                  {appendU > 0.02 && (
                    <g opacity={clamp01(appendU * 1.6)}>
                      <rect x={segX(NEW_SEG_I)} y={lane.y + 3} width={SEG_W * appendU} height={TAPE_H - 6} rx={4} fill="rgba(251,191,36,0.22)" stroke={colors.WARM} strokeWidth={1.2} />
                      <text x={segX(NEW_SEG_I) + SEG_W / 2} y={lane.y - 8} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily={MONO} opacity={clamp01((appendU - 0.5) * 3)}>
                        id=41 → done
                      </text>
                      <text x={segX(NEW_SEG_I) + SEG_W / 2} y={lane.y + TAPE_H + 14} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily={MONO} opacity={clamp01((appendU - 0.7) * 4)}>
                        1837_0
                      </text>
                    </g>
                  )}
                  {/* the client's playhead — still at the end of the snapshot */}
                  <g opacity={clamp01(lanesU * 2 - 0.5)}>
                    <path d={`M ${phX - 6} ${lane.y - 14} L ${phX + 6} ${lane.y - 14} L ${phX} ${lane.y - 3} Z`} fill={colors.WARM} />
                    <text x={phX} y={lane.y - 20} textAnchor="middle" fill={colors.WARM} fontSize={9.5} fontFamily={MONO}>
                      client offset
                    </text>
                  </g>
                </g>
              )}
              {/* fan probe + verdict */}
              {fanU > 0.02 && (
                <g>
                  <line
                    x1={SIEVE_OUT.x}
                    y1={SIEVE_OUT.y}
                    x2={SIEVE_OUT.x + (gatePos(li).x - SIEVE_OUT.x) * clamp01(fanU * 1.3 - li * 0.12)}
                    y2={SIEVE_OUT.y + (gatePos(li).y - SIEVE_OUT.y) * clamp01(fanU * 1.3 - li * 0.12)}
                    stroke={colors.GRID}
                    strokeWidth={1.2}
                    strokeDasharray="4 4"
                  />
                  {verdict > 0.4 && (
                    <g>
                      <circle cx={gatePos(li).x} cy={gatePos(li).y} r={11} fill={colors.BG} stroke={pass ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1.6} />
                      <text x={gatePos(li).x} y={gatePos(li).y + 4.5} textAnchor="middle" fill={pass ? colors.POSITIVE : colors.NEGATIVE} fontSize={12} fontWeight={700}>
                        {pass ? '✓' : '✗'}
                      </text>
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* ------------------------------------------------ the ack arc back to Postgres */}
        <g opacity={clamp01(ackU * 2)}>
          <path
            d={`M ${SIEVE.x + SIEVE.w / 2} ${SIEVE.y - 10} C ${SIEVE.x + 260} ${SIEVE.y - 92}, ${PG.x - 320} ${PG.y - 60}, ${PG.x - 66} ${PG.y + 6}`}
            fill="none"
            stroke={colors.POSITIVE}
            strokeWidth={1.4}
            strokeDasharray="5 5"
            strokeDashoffset={40 * (1 - ackU)}
            opacity={0.85}
          />
          <text x={(SIEVE.x + PG.x) / 2 - 40} y={SIEVE.y - 74} fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>
            FlushTracker · ack flushed offset
          </text>
        </g>

        {/* ------------------------------------------------ the gap brace */}
        <g opacity={gapU}>
          <path
            d={`M ${phX} ${OUR_LANE_Y + TAPE_H + 26} C ${phX} ${OUR_LANE_Y + TAPE_H + 40}, ${headX} ${OUR_LANE_Y + TAPE_H + 40}, ${headX} ${OUR_LANE_Y + TAPE_H + 26}`}
            fill="none"
            stroke={colors.NEGATIVE}
            strokeWidth={1.6}
          />
          <text x={(phX + headX) / 2 + 60} y={OUR_LANE_Y + TAPE_H + 62} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>
            the gap — what the client hasn’t seen yet
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
