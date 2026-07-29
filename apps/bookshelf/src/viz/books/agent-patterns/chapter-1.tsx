// Manager-Worker: the fan and the tape
//
// Grounding: packages/agents-runtime/skills/designing-entities/references/
// patterns/manager-worker.md — a parent spawns a FIXED set of specialists
// (the docs' optimist / pessimist / pragmatist trio), records each child in
// its `children` state collection, sets wake:{on:"runFinished",
// includeResponse:true} on every spawn, returns (goes dark), collects on
// later wakes with Promise.all, then synthesizes. Spawn-once guard:
// `children.get(id)` before ctx.spawn; reuse via ctx.observe(entity(url)).
// README.md: an entity IS an append-only stream, materialized into typed
// collections on every wake.
//
// Centerpiece: the manager's STREAM TAPE growing under the machine while the
// manager itself blinks between lit (handler running) and dark (durable,
// dormant). The fan-out/fan-in is drawn once and harvested at the braid.
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

const TAU = Math.PI * 2;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — one machine: manager (left), three fixed specialists (right),
// the manager's append-only stream tape along the bottom.
// ---------------------------------------------------------------------------

const MGR = { x: 300, y: 270 } as const;
const MGR_W = 176;
const MGR_H = 78;

interface Role {
  id: string;
  color: string;
  y: number;
}
const WX = 940;
const ROLES: Role[] = [
  { id: 'optimist', color: colors.POSITIVE, y: 128 },
  { id: 'pessimist', color: colors.NEGATIVE, y: 270 },
  { id: 'pragmatist', color: colors.ACCENT, y: 412 },
];
// completion order — deliberately NOT spawn order (wakes land out of order)
const FINISH_ORDER = [1, 0, 2];

const TAPE_Y = 520;
const TAPE_X0 = 150;
const CELL_W = 152;
const CELL_H = 56;
// tape cells in append order: three spawns, then outputs in FINISH order
const TAPE_CELLS = [
  { action: 'children_insert', key: 'optimist', color: ROLES[0].color },
  { action: 'children_insert', key: 'pessimist', color: ROLES[1].color },
  { action: 'children_insert', key: 'pragmatist', color: ROLES[2].color },
  { action: 'children_update', key: 'pessimist', color: ROLES[1].color },
  { action: 'children_update', key: 'optimist', color: ROLES[0].color },
  { action: 'children_update', key: 'pragmatist', color: ROLES[2].color },
];

/** cubic bezier between the manager's right edge and a worker's left edge */
function fanPoint(role: Role, t: number): { x: number; y: number } {
  const x0 = MGR.x + MGR_W / 2;
  const y0 = MGR.y;
  const x1 = WX - 78;
  const y1 = role.y;
  const c1 = { x: x0 + 170, y: y0 };
  const c2 = { x: x1 - 170, y: y1 };
  const u = 1 - t;
  return {
    x: u * u * u * x0 + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * x1,
    y: u * u * u * y0 + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * y1,
  };
}
function fanD(role: Role, reveal: number): string {
  const n = 32;
  const upto = Math.max(1, Math.round(n * clamp01(reveal)));
  const parts: string[] = [];
  for (let i = 0; i <= upto; i++) {
    const p = fanPoint(role, i / n);
    parts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join('');
}

// camera marks
const CAM_TAPE: CameraState = { x: 560, y: 470, k: 1.5 };
const CAM_MGR: CameraState = { x: 430, y: 300, k: 1.35 };

// ---------------------------------------------------------------------------
// Timeline (~74s, ten beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const qU = tl.channel('qU', 0); // question card slides in
  const mgrLit = tl.channel('mgrLit', 0); // 1 = handler running, ~0.12 = dark
  const fanU = tl.channel('fanU', 0); // fan edges + worker bloom (staggered)
  const spawnChipU = tl.channel('spawnChipU', 0); // ctx.spawn chip
  const tapeU = tl.channel('tapeU', 0); // tape baseline draw-on
  const rowsU = tl.channel('rowsU', 0); // 3 spawn rows stamp (staggered)
  const wakeChipU = tl.channel('wakeChipU', 0); // wake:{on:"runFinished"} chip
  const darkLblU = tl.channel('darkLblU', 0); // "nothing is running" label
  const thinkT = tl.channel('thinkT', 0); // worker shimmer clock (linear)
  const bolt1U = tl.channel('bolt1U', 0); // pessimist wake bolt
  const bolt2U = tl.channel('bolt2U', 0); // optimist wake bolt
  const bolt3U = tl.channel('bolt3U', 0); // pragmatist wake bolt
  const q2U = tl.channel('q2U', 0); // second question card
  const ghostU = tl.channel('ghostU', 0); // duplicate ghost: 0..1 in, 1..2 out
  const guardChipU = tl.channel('guardChipU', 0); // children.get / observe chips
  const sendU = tl.channel('sendU', 0); // re-send pulses along the fan
  const braidU = tl.channel('braidU', 0); // strands converge on the manager
  const synthU = tl.channel('synthU', 0); // synthesis card pops
  const endU = tl.channel('endU', 0); // closing quiet-down

  // — beat 1 · the question and the manager —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: "Some questions deserve three thinkers. On this platform that's not three processes to babysit — it's one manager entity and a fan of workers.",
  });
  tl.tween(qU, 1, { at: 0.7, dur: 0.9, ease: ease.enter });
  tl.tween(mgrLit, 1, { at: 1.8, dur: 0.7, ease: ease.enter });
  tl.hold(6.9, 0.5);

  // — beat 2 · the fan: three fixed specialists —
  tl.caption({
    at: 7.4,
    dur: 6.8,
    text: 'The manager fans out to a fixed trio of specialists: an optimist, a pessimist, and a pragmatist. Same question to all three, different instructions.',
  });
  tl.tween(fanU, 1, { at: 7.8, dur: 2.4, ease: ease.draw });
  tl.tween(spawnChipU, 1, { at: 10.6, dur: 0.6, ease: ease.enter });
  tl.hold(14.2, 0.6);

  // — beat 3 · every spawn is a write: the tape —
  tl.caption({
    at: 14.8,
    dur: 6.4,
    text: "Every spawn is also a write. The manager records each child in its own state: a key, the child's address, and the role it plays.",
  });
  tl.tween(cam, CAM_TAPE, { at: 15.0, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: 15.4, dur: 1.2, ease: ease.draw });
  tl.tween(rowsU, 1, { at: 16.8, dur: 2.6, ease: ease.linear });
  tl.hold(21.2, 0.4);

  // — beat 4 · the durable move: ask to be woken, then return —
  tl.caption({
    at: 21.6,
    dur: 6.8,
    text: 'Then the move that makes this durable. The manager asks to be woken when each child finishes — and returns. It goes completely dark.',
  });
  tl.tween(wakeChipU, 1, { at: 22.0, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 24.2, dur: 1.4, ease: ease.move });
  tl.tween(mgrLit, 0.12, { at: 26.2, dur: 1.0, ease: ease.move });
  tl.tween(spawnChipU, 0, { at: 24.2, dur: 0.6, ease: ease.enter });

  // — beat 5 · nothing is running —
  tl.caption({
    at: 29.0,
    dur: 5.8,
    text: "Nothing is running now. There's no thread waiting, no process holding the plan in memory. The plan lives in the stream.",
  });
  tl.tween(darkLblU, 1, { at: 29.6, dur: 0.8, ease: ease.enter });
  tl.tween(thinkT, 1, { at: 7.8, dur: 42, ease: ease.linear }); // shimmer clock
  tl.hold(34.8, 0.4);

  // — beat 6 · first wake, out of order —
  tl.caption({
    at: 35.2,
    dur: 7.0,
    text: "The pessimist finishes first — order doesn't matter here. Its completion arrives as a wake: the manager lights up, records the answer, and goes dark again.",
  });
  tl.tween(darkLblU, 0, { at: 35.4, dur: 0.5, ease: ease.enter });
  tl.tween(bolt1U, 1, { at: 36.2, dur: 1.6, ease: ease.linear });
  tl.tween(mgrLit, 1, { at: 37.8, dur: 0.3, ease: ease.pop });
  tl.tween(mgrLit, 0.12, { at: 39.6, dur: 0.8, ease: ease.move });
  tl.hold(42.2, 0.4);

  // — beat 7 · the rhythm —
  tl.caption({
    at: 42.6,
    dur: 5.6,
    text: 'Two more wakes, and the rhythm is the whole trick: light up, write it down, disappear.',
  });
  tl.tween(bolt2U, 1, { at: 43.0, dur: 1.4, ease: ease.linear });
  tl.tween(mgrLit, 1, { at: 44.4, dur: 0.25, ease: ease.pop });
  tl.tween(mgrLit, 0.12, { at: 45.4, dur: 0.6, ease: ease.move });
  tl.tween(bolt3U, 1, { at: 45.8, dur: 1.4, ease: ease.linear });
  tl.tween(mgrLit, 1, { at: 47.2, dur: 0.25, ease: ease.pop });
  tl.tween(mgrLit, 0.12, { at: 48.0, dur: 0.6, ease: ease.move });

  // — beat 8 · the spawn-once guard —
  tl.caption({
    at: 49.4,
    dur: 7.4,
    text: 'Ask again and the manager checks its notes first. The children already exist — so it observes them and sends the new question, instead of spawning twins.',
  });
  tl.tween(q2U, 1, { at: 49.8, dur: 0.8, ease: ease.enter });
  tl.tween(mgrLit, 1, { at: 50.8, dur: 0.4, ease: ease.enter });
  tl.tween(ghostU, 1, { at: 51.6, dur: 0.9, ease: ease.enter });
  tl.tween(guardChipU, 1, { at: 52.6, dur: 0.6, ease: ease.enter });
  tl.tween(ghostU, 2, { at: 53.8, dur: 0.9, ease: ease.move });
  tl.tween(sendU, 1, { at: 54.8, dur: 1.6, ease: ease.linear });

  // — beat 9 · synthesis: the braid —
  tl.caption({
    at: 57.6,
    dur: 6.4,
    text: "With all three reports in, the manager's model runs the synthesis: three perspectives braided into one answer.",
  });
  tl.tween(guardChipU, 0, { at: 57.8, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_MGR, { at: 58.0, dur: 1.5, ease: ease.move });
  tl.tween(braidU, 1, { at: 58.6, dur: 2.2, ease: ease.draw });
  tl.tween(synthU, 1, { at: 61.2, dur: 0.6, ease: ease.pop });

  // — beat 10 · closing: name the shape, keep the tape —
  tl.caption({
    at: 64.8,
    dur: 7.4,
    text: "That's manager-worker: a fixed set of roles, the same subject, all in parallel. And under it all, a tape recording every move. Remember that tape.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 65.2, dur: 1.6, ease: ease.move });
  tl.tween(endU, 1, { at: 66.4, dur: 1.4, ease: ease.move });
  tl.hold(72.2, 1.6);

  return {
    tl,
    cam,
    qU,
    mgrLit,
    fanU,
    spawnChipU,
    tapeU,
    rowsU,
    wakeChipU,
    darkLblU,
    thinkT,
    bolt1U,
    bolt2U,
    bolt3U,
    q2U,
    ghostU,
    guardChipU,
    sendU,
    braidU,
    synthU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Capsule({
  x,
  y,
  w,
  h,
  lit,
  color,
  label,
  sub,
  opacity = 1,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lit: number;
  color: string;
  label: string;
  sub?: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      {lit > 0.2 && (
        <rect
          x={x - w / 2 - 7}
          y={y - h / 2 - 7}
          width={w + 14}
          height={h + 14}
          rx={20}
          fill={color}
          opacity={0.16 * lit}
        />
      )}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={14}
        fill={colors.PANEL}
        stroke={color}
        strokeWidth={1.8}
        strokeOpacity={0.25 + 0.75 * lit}
      />
      <circle cx={x - w / 2 + 18} cy={y - h / 2 + 16} r={4.5} fill={color} opacity={0.25 + 0.75 * lit} />
      <text
        x={x}
        y={sub ? y - 2 : y + 5}
        textAnchor="middle"
        fill={colors.TEXT}
        fontSize={16}
        fontWeight={600}
        opacity={0.45 + 0.55 * lit}
      >
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 19} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
          {sub}
        </text>
      )}
    </g>
  );
}

function Chip({
  x,
  y,
  text,
  color,
  u,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  u: number;
  anchor?: 'middle' | 'start';
}) {
  if (u <= 0.01) return null;
  const w = text.length * 7.4 + 24;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={u}>
      <rect x={x0} y={y - 15} width={w} height={28} rx={8} fill={colors.BG} stroke={color} strokeOpacity={0.7} />
      <text x={x0 + w / 2} y={y + 5} textAnchor="middle" fill={color} fontSize={12.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const qU = s.get(scene.qU);
  const mgrLit = s.get(scene.mgrLit);
  const fanU = s.get(scene.fanU);
  const spawnChipU = s.get(scene.spawnChipU);
  const tapeU = s.get(scene.tapeU);
  const rowsU = s.get(scene.rowsU);
  const wakeChipU = s.get(scene.wakeChipU);
  const darkLblU = s.get(scene.darkLblU);
  const thinkT = s.get(scene.thinkT);
  const boltU = [s.get(scene.bolt2U), s.get(scene.bolt1U), s.get(scene.bolt3U)]; // per ROLE index
  const q2U = s.get(scene.q2U);
  const ghostU = s.get(scene.ghostU);
  const guardChipU = s.get(scene.guardChipU);
  const sendU = s.get(scene.sendU);
  const braidU = s.get(scene.braidU);
  const synthU = s.get(scene.synthU);
  const endU = s.get(scene.endU);

  // rows shown on the tape: spawns while rowsU runs, outputs as bolts land
  const outLanded = [s.get(scene.bolt1U), s.get(scene.bolt2U), s.get(scene.bolt3U)];
  const cellU = (i: number): number => {
    if (i < 3) return win(rowsU, 3, i, 1.4);
    return clamp01((outLanded[i - 3] - 0.92) / 0.08);
  };

  const fanDim = 1 - 0.85 * endU;
  const qText = q2U > 0.5 ? 'the follow-up' : 'the question';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- fan edges ---------------- */}
        <g opacity={fanDim}>
          {ROLES.map((r, i) => {
            const u = win(fanU, 3, i, 1.8);
            if (u <= 0) return null;
            return (
              <path
                key={r.id}
                d={fanD(r, u)}
                fill="none"
                stroke={r.color}
                strokeWidth={1.6}
                strokeOpacity={0.5}
              />
            );
          })}
          {/* re-send pulses on reuse */}
          {sendU > 0.01 &&
            sendU < 1 &&
            ROLES.map((r) => {
              const p = fanPoint(r, sendU);
              return <circle key={r.id} cx={p.x} cy={p.y} r={5} fill={colors.WARM} opacity={0.9} />;
            })}
          {/* wake bolts: worker → manager */}
          {ROLES.map((r, i) => {
            const u = boltU[i];
            if (u <= 0.01 || u >= 0.99) return null;
            const p = fanPoint(r, 1 - u);
            return (
              <g key={r.id}>
                <circle cx={p.x} cy={p.y} r={6.5} fill={r.color} />
                <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={r.color} strokeOpacity={0.5} />
                <text x={p.x} y={p.y - 16} textAnchor="middle" fill={r.color} fontSize={11} fontFamily={MONO}>
                  runFinished
                </text>
              </g>
            );
          })}
          {/* braid: the three strands converge on the manager */}
          {braidU > 0.01 &&
            ROLES.map((r, i) => {
              const u = clamp01(braidU * 1.3 - i * 0.15);
              if (u <= 0) return null;
              const n = 26;
              const upto = Math.max(1, Math.round(n * u));
              const parts: string[] = [];
              for (let k = 0; k <= upto; k++) {
                const p = fanPoint(r, 1 - k / n);
                const sway = Math.sin((k / n) * TAU * 1.5 + i * 2.1) * 14 * (k / n);
                parts.push(`${k === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${(p.y + sway).toFixed(1)}`);
              }
              return (
                <path
                  key={r.id}
                  d={parts.join('')}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={2.6}
                  strokeOpacity={0.85}
                />
              );
            })}
        </g>

        {/* ---------------- workers ---------------- */}
        {ROLES.map((r, i) => {
          const u = win(fanU, 3, i, 1.8);
          if (u <= 0) return null;
          const done = outLanded[i === 0 ? 1 : i === 1 ? 0 : 2] > 0.9; // bolt per role
          const working = fanU > 0.95 && !done;
          return (
            <g key={r.id} opacity={u * (1 - 0.85 * endU)}>
              <Capsule x={WX} y={r.y} w={150} h={64} lit={working ? 0.9 : 0.3} color={r.color} label={r.id} sub={'worker'} />
              {/* thinking shimmer bars */}
              {working &&
                [0, 1, 2].map((b) => {
                  const w = 30 + 26 * (0.5 + 0.5 * Math.sin(TAU * (thinkT * 2.4 + i * 0.37 + b * 0.21)));
                  return (
                    <rect
                      key={b}
                      x={WX - 55}
                      y={r.y + 34 + b * 5}
                      width={w}
                      height={2.5}
                      rx={1}
                      fill={r.color}
                      opacity={0.5}
                    />
                  );
                })}
              {done && (
                <text x={WX + 62} y={r.y - 24} textAnchor="end" fontSize={13} fill={r.color}>
                  ✓
                </text>
              )}
            </g>
          );
        })}

        {/* ghost twin — the duplicate that never happens */}
        {ghostU > 0.01 && ghostU < 1.99 && (
          <g opacity={ghostU <= 1 ? ghostU * 0.75 : (2 - ghostU) * 0.75}>
            <rect
              x={WX - 75 + 26}
              y={ROLES[0].y - 32 + 24}
              width={150}
              height={64}
              rx={14}
              fill="none"
              stroke={colors.NEGATIVE}
              strokeWidth={1.6}
              strokeDasharray="5 5"
            />
            <text x={WX + 26} y={ROLES[0].y + 28} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
              duplicate?
            </text>
          </g>
        )}

        {/* ---------------- manager + question ---------------- */}
        {qU > 0.01 && (
          <g opacity={qU * (1 - 0.8 * endU) * (1 - 0.7 * synthU)} transform={`translate(${-160 + 160 * qU} 0)`}>
            <rect x={68} y={MGR.y - 26} width={128} height={52} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.8} />
            <text x={132} y={MGR.y - 4} textAnchor="middle" fill={colors.WARM} fontSize={13}>
              {qText}
            </text>
            <text x={132} y={MGR.y + 15} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              initialMessage
            </text>
          </g>
        )}
        <Capsule x={MGR.x} y={MGR.y} w={MGR_W} h={MGR_H} lit={mgrLit} color={colors.SECONDARY} label="manager" sub="manager-worker" />
        {darkLblU > 0.01 && (
          <text
            x={MGR.x}
            y={MGR.y + 66}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={13}
            fontStyle="italic"
            opacity={darkLblU}
          >
            dormant — no process, no thread
          </text>
        )}

        {/* synthesis card */}
        {synthU > 0.01 && (
          <g opacity={synthU}>
            <rect x={MGR.x - 86} y={MGR.y + 62} width={172} height={58} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
            <text x={MGR.x} y={MGR.y + 86} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
              one answer
            </text>
            <text x={MGR.x} y={MGR.y + 106} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              three perspectives, braided
            </text>
          </g>
        )}

        {/* ---------------- chips ---------------- */}
        <Chip x={620} y={92} text={'ctx.spawn("worker", id, { systemPrompt, tools })'} color={colors.ACCENT} u={spawnChipU} />
        <Chip x={620} y={430} text={'wake: { on: "runFinished", includeResponse: true }'} color={colors.SECONDARY} u={wakeChipU} />
        <Chip x={560} y={128} text={'children.get(id) → exists'} color={colors.POSITIVE} u={guardChipU} />
        <Chip x={560} y={164} text={'ctx.observe(entity(url)) + send'} color={colors.POSITIVE} u={guardChipU} />

        {/* ---------------- the stream tape ---------------- */}
        {tapeU > 0.01 && (
          <g>
            <text x={TAPE_X0} y={TAPE_Y - 14} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={tapeU}>
              the manager&apos;s stream — append only
            </text>
            <line
              x1={TAPE_X0}
              y1={TAPE_Y + CELL_H + 10}
              x2={TAPE_X0 + (TAPE_X0 + TAPE_CELLS.length * CELL_W + 60 - TAPE_X0) * tapeU}
              y2={TAPE_Y + CELL_H + 10}
              stroke={colors.GRID}
              strokeWidth={2}
            />
            {TAPE_CELLS.map((c, i) => {
              const u = cellU(i);
              if (u <= 0) return null;
              const x = TAPE_X0 + i * CELL_W;
              return (
                <g key={i} opacity={u} transform={`translate(0 ${8 * (1 - u)})`}>
                  <rect x={x} y={TAPE_Y} width={CELL_W - 8} height={CELL_H} rx={8} fill={colors.PANEL} stroke={c.color} strokeOpacity={0.55} />
                  <text x={x + (CELL_W - 8) / 2} y={TAPE_Y + 22} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>
                    {c.action}
                  </text>
                  <circle cx={x + (CELL_W - 8) / 2 - 34} cy={TAPE_Y + 39} r={3.5} fill={c.color} />
                  <text x={x + (CELL_W - 8) / 2 + 5} y={TAPE_Y + 43} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                    {c.key}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
