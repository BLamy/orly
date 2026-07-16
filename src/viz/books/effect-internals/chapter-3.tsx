// Sharing One Thread
//
// Grounding: packages/effect/src/Scheduler.ts — MixedScheduler.shouldYield
// (fiber.currentOpCount >= fiber.maxOpsBeforeYield), MaxOpsBeforeYield
// (default 2048), PriorityBuckets (priority-ordered task arrays, FIFO within
// a bucket), MixedSchedulerDispatcher (setImmediate → runTasks, flush for the
// sync mode); packages/effect/src/internal/effect.ts — the runLoop yield check
// (wraps the next instruction in flatMap(yieldNow, …)), yieldNowWith
// (currentDispatcher.scheduleTask(() => fiber.evaluate(exitVoid), priority)),
// callback / op "Async" (register a resume, park the fiber), runSyncExit
// (new MixedScheduler("sync") + dispatcher flush).
//
// Centerpiece: three fibers time-slicing ONE thread lane. A 0→2048 op budget
// fills while a fiber runs; at the limit its continuation files into the
// priority-bucket queue, a macrotask tick drains the head, and the lane
// changes hands. An Async instruction parks a fiber for free until its
// callback re-queues it. Coda: runSync = the same machine, flushed.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const LANE = { x: 150, y: 320, w: 980, h: 66 } as const;
const LANE_SLOT = { x: 560, y: LANE.y + 9 } as const; // where the running chip sits
const CHIP = { w: 150, h: 48 } as const;

const HOME = [
  { x: 190, y: 168 },
  { x: 420, y: 168 },
  { x: 650, y: 168 },
] as const;

const METER = { x: 900, y: 152 } as const; // budget bar + counter
const QUEUE = { x: 120, y: 458, w: 500, h: 122 } as const;
const slotPos = (i: number) => ({ x: QUEUE.x + 18 + i * 122, y: QUEUE.y + 54 });
const TICK_CHIP = { x: QUEUE.x + QUEUE.w + 28, y: QUEUE.y + 60 } as const;
const PARK = { x: 920, y: 430, w: 292, h: 128 } as const;
const CODA = { x: 400, y: 170, w: 480, h: 200 } as const;

const CAM_WIDE: CameraState = { x: 640, y: 360, k: 1.0 };
const CAM_LANE: CameraState = { x: 620, y: 300, k: 1.18 };
const CAM_QUEUE: CameraState = { x: 480, y: 430, k: 1.24 };
const CAM_PARK: CameraState = { x: 880, y: 420, k: 1.22 };

const FIBER_COLORS = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE] as const;
const FIBER_NAMES = ['fiber 1', 'fiber 2', 'fiber 3'] as const;

/** Piecewise-linear travel along waypoints, u in 0..len-1. */
function alongIdx(pts: ReadonlyArray<{ x: number; y: number }>, u: number): { x: number; y: number } {
  const f = Math.max(0, Math.min(pts.length - 1, u));
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
  };
}

// fiber chip journeys (waypoint index = channel value)
const PATH_F1 = [HOME[0], { x: LANE_SLOT.x, y: LANE_SLOT.y }, HOME[0], { x: LANE_SLOT.x, y: LANE_SLOT.y }, HOME[0]] as const;
const PATH_F2 = [HOME[1], { x: LANE_SLOT.x, y: LANE_SLOT.y }, HOME[1], { x: LANE_SLOT.x, y: LANE_SLOT.y }, HOME[1]] as const;
const PATH_F3 = [
  HOME[2],
  { x: LANE_SLOT.x, y: LANE_SLOT.y },
  { x: PARK.x + 22, y: PARK.y + 40 },
  { x: LANE_SLOT.x, y: LANE_SLOT.y },
] as const;

// ---------------------------------------------------------------------------
// Timeline (~96s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const laneU = tl.channel('laneU', 0);
  const chipsU = tl.channel('chipsU', 0); // three fibers appear
  const queueU = tl.channel('queueU', 0); // queue panel
  const q2U = tl.channel('q2U', 0); // fiber 2's task waits in slot 0
  const q3U = tl.channel('q3U', 0); // fiber 3's task waits in slot 1
  const f1P = tl.channel('f1P', 0); // fiber 1 journey (waypoints)
  const f2P = tl.channel('f2P', 0);
  const f3P = tl.channel('f3P', 0);
  const ops = tl.channel('ops', 0); // budget counter of the running fiber
  const yflash = tl.channel('yflash', 0); // shouldYield flash
  const q1U = tl.channel('q1U', 0); // fiber 1's continuation into the queue
  const d2 = tl.channel('d2', 0); // drain T2 → fiber 2 runs
  const q2bU = tl.channel('q2bU', 0); // fiber 2 re-queues after its budget
  const d3 = tl.channel('d3', 0); // drain T3 → fiber 3 runs
  const asyncU = tl.channel('asyncU', 0); // Async instruction card on the lane
  const timerU = tl.channel('timerU', 0); // park-zone timer arc
  const d1 = tl.channel('d1', 0); // drain T1 → fiber 1 resumes (background)
  const fireU = tl.channel('fireU', 0); // callback fires
  const qRU = tl.channel('qRU', 0); // resume task into the queue
  const dB = tl.channel('dB', 0); // drain T2' (FIFO head first)
  const dR = tl.channel('dR', 0); // drain resume → fiber 3 back on the lane
  const codaU = tl.channel('codaU', 0); // runSync panel
  const flushU = tl.channel('flushU', 0); // coda mini-queue drains at once
  const dimU = tl.channel('dimU', 0);

  // — beat 1 · one thread, many fibers —
  tl.caption({
    at: 0.5,
    dur: 7.0,
    text: 'Effect promises you can run tens of thousands of fibers at once. But the runtime owns exactly one thread — so the fibers have to share it, on purpose.',
  });
  tl.tween(laneU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(chipsU, 1, { at: 1.8, dur: 1.8, ease: ease.linear });
  tl.tween(queueU, 1, { at: 3.6, dur: 1.0, ease: ease.enter });
  tl.tween(q2U, 1, { at: 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(q3U, 1, { at: 5.2, dur: 0.6, ease: ease.enter });
  tl.hold(7.5, 0.5);

  // — beat 2 · the counter —
  tl.caption({
    at: 8.0,
    dur: 6.2,
    text: "Here's the contract every fiber signs: run all you want, but every single instruction the loop evaluates ticks a counter.",
  });
  tl.tween(f1P, 1, { at: 8.3, dur: 1.1, ease: ease.move });
  tl.tween(cam, CAM_LANE, { at: 8.4, dur: 1.3, ease: ease.move });
  tl.tween(ops, 730, { at: 9.6, dur: 4.4, ease: ease.linear });
  tl.hold(14.2, 0.5);

  // — beat 3 · 2048 —
  tl.caption({
    at: 14.7,
    dur: 6.6,
    text: 'At two thousand and forty eight operations — the default budget — the scheduler answers yes to one standing question: should this fiber yield?',
  });
  tl.tween(ops, 2048, { at: 15.0, dur: 3.6, ease: ease.linear });
  tl.tween(yflash, 1, { at: 18.7, dur: 0.5, ease: ease.pop });
  tl.hold(21.3, 0.6);

  // — beat 4 · the yield —
  tl.caption({
    at: 21.9,
    dur: 7.2,
    text: "The loop doesn't freeze the fiber mid step. It wraps the fiber's next instruction in a yield, so the entire rest of the program becomes one task in a queue.",
  });
  tl.tween(q1U, 1, { at: 22.8, dur: 1.3, ease: ease.move }); // continuation files in
  tl.tween(f1P, 2, { at: 23.4, dur: 1.0, ease: ease.move }); // chip leaves the lane
  tl.tween(yflash, 0, { at: 23.0, dur: 0.6, ease: ease.enter });
  tl.set(ops, 0, 24.2);
  tl.hold(29.1, 0.5);

  // — beat 5 · the buckets —
  tl.caption({
    at: 29.6,
    dur: 6.2,
    text: "The queue is a row of priority buckets. Lower priority numbers drain first, and inside a bucket it's strictly first in, first out.",
  });
  tl.tween(cam, CAM_QUEUE, { at: 29.8, dur: 1.3, ease: ease.move });
  tl.hold(35.8, 0.6);

  // — beat 6 · the tick —
  tl.caption({
    at: 36.4,
    dur: 6.0,
    text: 'One tick of the event loop later, the scheduler drains the buckets — and a different fiber takes the lane.',
  });
  tl.tween(d2, 1, { at: 37.4, dur: 1.1, ease: ease.move });
  tl.tween(f2P, 1, { at: 38.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_LANE, { at: 38.4, dur: 1.3, ease: ease.move });
  tl.tween(ops, 2048, { at: 39.4, dur: 3.4, ease: ease.linear });
  tl.hold(42.4, 0.4);

  // — beat 7 · fairness is arithmetic —
  tl.caption({
    at: 42.8,
    dur: 7.0,
    text: "Budget, yield, queue, tick — round and round. No fiber can hold the thread past its budget, so fairness isn't a policy. It's arithmetic.",
  });
  tl.tween(q2bU, 1, { at: 43.6, dur: 0.9, ease: ease.move }); // fiber 2 re-queues
  tl.tween(f2P, 2, { at: 44.2, dur: 0.8, ease: ease.move });
  tl.set(ops, 0, 44.8);
  tl.tween(d3, 1, { at: 45.6, dur: 0.9, ease: ease.move }); // fiber 3's turn
  tl.tween(f3P, 1, { at: 46.4, dur: 0.9, ease: ease.move });
  tl.tween(ops, 512, { at: 47.4, dur: 2.2, ease: ease.linear });
  tl.hold(49.8, 0.4);

  // — beat 8 · async parks for free —
  tl.caption({
    at: 50.2,
    dur: 7.2,
    text: 'Waiting is even cheaper. When a fiber hits an asynchronous instruction it parks itself: no thread, no budget — just a resume callback registered with the outside world.',
  });
  tl.tween(asyncU, 1, { at: 50.6, dur: 0.7, ease: ease.pop });
  tl.tween(f3P, 2, { at: 51.8, dur: 1.2, ease: ease.move }); // slide to the park zone
  tl.tween(cam, CAM_PARK, { at: 52.0, dur: 1.4, ease: ease.move });
  tl.tween(timerU, 1, { at: 53.4, dur: 6.5, ease: ease.linear });
  tl.tween(d1, 1, { at: 54.6, dur: 0.9, ease: ease.move }); // lane goes on without it
  tl.tween(f1P, 3, { at: 55.4, dur: 0.9, ease: ease.move });
  tl.set(ops, 0, 55.4);
  tl.tween(ops, 1400, { at: 56.2, dur: 5.2, ease: ease.linear });
  tl.hold(57.4, 0.5);

  // — beat 9 · the callback fires —
  tl.caption({
    at: 57.9,
    dur: 7.2,
    text: 'When the callback finally fires, the parked continuation is queued like any other task — and the loop picks up exactly where it stopped.',
  });
  tl.tween(fireU, 1, { at: 60.0, dur: 0.6, ease: ease.pop });
  tl.tween(qRU, 1, { at: 60.8, dur: 1.0, ease: ease.move });
  tl.tween(f1P, 4, { at: 61.6, dur: 0.8, ease: ease.move }); // fiber 1 wraps up
  tl.tween(dB, 1, { at: 62.4, dur: 0.7, ease: ease.move }); // FIFO head first
  tl.tween(f2P, 3, { at: 62.8, dur: 0.6, ease: ease.move });
  tl.tween(f2P, 4, { at: 63.6, dur: 0.6, ease: ease.move });
  tl.tween(dR, 1, { at: 64.2, dur: 0.8, ease: ease.move }); // then the resume
  tl.tween(f3P, 3, { at: 64.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_LANE, { at: 64.4, dur: 1.4, ease: ease.move });
  tl.set(ops, 0, 64.6);
  tl.tween(ops, 380, { at: 65.6, dur: 2.4, ease: ease.linear });
  tl.hold(65.6, 0.4);

  // — beat 10 · runSync: the flushed tempo —
  tl.caption({
    at: 66.0,
    dur: 7.6,
    text: 'And the synchronous runner is this exact machine with the patience removed: it flushes the queue before returning. One scheduler, two tempos.',
  });
  tl.tween(dimU, 1, { at: 66.4, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 66.4, dur: 1.4, ease: ease.move });
  tl.tween(codaU, 1, { at: 67.6, dur: 0.9, ease: ease.enter });
  tl.tween(flushU, 1, { at: 69.6, dur: 1.6, ease: ease.move });
  tl.hold(73.6, 1.8);

  return {
    tl,
    cam,
    laneU,
    chipsU,
    queueU,
    q2U,
    q3U,
    f1P,
    f2P,
    f3P,
    ops,
    yflash,
    q1U,
    d2,
    q2bU,
    d3,
    asyncU,
    timerU,
    d1,
    fireU,
    qRU,
    dB,
    dR,
    codaU,
    flushU,
    dimU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

function FiberChip({ i, pos, u, running }: { i: number; pos: { x: number; y: number }; u: number; running: boolean }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={pos.x} y={pos.y} width={CHIP.w} height={CHIP.h} rx={10} fill={colors.PANEL} stroke={FIBER_COLORS[i]} strokeWidth={running ? 2.2 : 1.4} />
      <text x={pos.x + 14} y={pos.y + 21} fill={FIBER_COLORS[i]} fontSize={13.5} fontFamily={MONO} fontWeight={700}>
        {FIBER_NAMES[i]}
      </text>
      <text x={pos.x + 14} y={pos.y + 38} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        {running ? 'runLoop …' : 'suspended'}
      </text>
    </g>
  );
}

function TaskCard({
  label,
  color,
  slotIdx,
  inU,
  outU,
}: {
  label: string;
  color: string;
  slotIdx: number;
  inU: number;
  outU: number;
}) {
  const vis = inU * (1 - outU);
  if (vis <= 0.01) return null;
  const slot = slotPos(Math.max(0, slotIdx));
  const x = lerp(slot.x, LANE_SLOT.x, outU);
  const y = lerp(slot.y, LANE_SLOT.y + 8, outU);
  return (
    <g opacity={vis}>
      <rect x={x} y={y} width={106} height={34} rx={8} fill={colors.BG} stroke={color} strokeWidth={1.4} />
      <text x={x + 53} y={y + 22} textAnchor="middle" fill={color} fontSize={11.5} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

/** A macrotask tick pulse, visible in the early phase of a drain channel. */
function TickPulse({ d }: { d: number }) {
  if (d <= 0 || d >= 0.55) return null;
  const t = d / 0.55;
  const x = lerp(TICK_CHIP.x, QUEUE.x + 70, t);
  return <circle cx={x} cy={TICK_CHIP.y} r={6} fill={colors.WARM} opacity={1 - t * 0.5} />;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const laneU = s.get(scene.laneU);
  const chipsU = s.get(scene.chipsU);
  const queueU = s.get(scene.queueU);
  const q2U = s.get(scene.q2U);
  const q3U = s.get(scene.q3U);
  const f1P = s.get(scene.f1P);
  const f2P = s.get(scene.f2P);
  const f3P = s.get(scene.f3P);
  const ops = Math.round(s.get(scene.ops));
  const yflash = s.get(scene.yflash);
  const q1U = s.get(scene.q1U);
  const d2 = s.get(scene.d2);
  const q2bU = s.get(scene.q2bU);
  const d3 = s.get(scene.d3);
  const asyncU = s.get(scene.asyncU);
  const timerU = s.get(scene.timerU);
  const d1 = s.get(scene.d1);
  const fireU = s.get(scene.fireU);
  const qRU = s.get(scene.qRU);
  const dB = s.get(scene.dB);
  const dR = s.get(scene.dR);
  const codaU = s.get(scene.codaU);
  const flushU = s.get(scene.flushU);
  const dimU = s.get(scene.dimU);

  const mainOp = 1 - 0.85 * dimU;
  const p1 = alongIdx(PATH_F1, f1P);
  const p2 = alongIdx(PATH_F2, f2P);
  const p3 = alongIdx(PATH_F3, f3P);
  const onLane = (p: number, laneIdx: number[]) => laneIdx.some((k) => Math.abs(p - k) < 0.25);
  const budgetFrac = clamp01(ops / 2048);
  const parked = f3P > 1.6 && f3P < 2.4;

  // FIFO slot indices (continuous — earlier drains shift later tasks left)
  const idxT3 = 1 - d2;
  const idxT1 = 2 - d2 - d3;
  const idxT2b = (1 - d3) + (1 - d1);
  const idxTR = (1 - d3) + (1 - d1) + (1 - dB);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* the one thread */}
          <g opacity={laneU}>
            <rect x={LANE.x} y={LANE.y} width={LANE.w * laneU} height={LANE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={LANE.x + 16} y={LANE.y - 12} fill={colors.MUTED} fontSize={13}>
              the only thread
            </text>
          </g>

          {/* the budget meter */}
          <g opacity={clamp01(chipsU * 2)}>
            <text x={METER.x} y={METER.y - 12} fill={colors.MUTED} fontSize={12.5}>
              op budget of the running fiber
            </text>
            <rect x={METER.x} y={METER.y} width={230} height={14} rx={7} fill={colors.BG} stroke={colors.GRID} />
            <rect x={METER.x + 2} y={METER.y + 2} width={226 * budgetFrac} height={10} rx={5} fill={budgetFrac > 0.97 ? colors.NEGATIVE : colors.WARM} opacity={0.9} />
            <text x={METER.x} y={METER.y + 38} fill={budgetFrac > 0.97 ? colors.NEGATIVE : colors.TEXT} fontSize={15} fontFamily={MONO} fontWeight={600}>
              {ops.toLocaleString('en-US')} / 2048
            </text>
            <text x={METER.x + 130} y={METER.y + 56} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              maxOpsBeforeYield
            </text>
          </g>

          {/* shouldYield flash */}
          {yflash > 0.02 && (
            <g opacity={yflash}>
              <rect x={METER.x - 6} y={METER.y + 64} width={214} height={30} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.6} />
              <text x={METER.x + 101 - 6} y={METER.y + 84} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                shouldYield → true
              </text>
            </g>
          )}

          {/* fibers */}
          <FiberChip i={0} pos={p1} u={clamp01(chipsU * 3)} running={onLane(f1P, [1, 3])} />
          <FiberChip i={1} pos={p2} u={clamp01(chipsU * 3 - 1)} running={onLane(f2P, [1, 3])} />
          <FiberChip i={2} pos={p3} u={clamp01(chipsU * 3 - 2)} running={onLane(f3P, [1, 3])} />

          {/* the Async instruction card, met on the lane */}
          {asyncU > 0.02 && f3P < 2.4 && (
            <g opacity={asyncU * (parked ? 0.4 : 1)}>
              <rect x={LANE_SLOT.x + 170} y={LANE_SLOT.y + 2} width={128} height={40} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.6} />
              <text x={LANE_SLOT.x + 234} y={LANE_SLOT.y + 20} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
                op: "Async"
              </text>
              <text x={LANE_SLOT.x + 234} y={LANE_SLOT.y + 35} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                register(resume)
              </text>
            </g>
          )}

          {/* the queue — PriorityBuckets */}
          <g opacity={queueU}>
            <rect x={QUEUE.x} y={QUEUE.y} width={QUEUE.w} height={QUEUE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={QUEUE.x + 16} y={QUEUE.y + 26} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
              PriorityBuckets
            </text>
            <text x={QUEUE.x + QUEUE.w - 16} y={QUEUE.y + 26} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              priority 0 · FIFO →
            </text>
            {[0, 1, 2].map((i) => {
              const p = slotPos(i);
              return <rect key={i} x={p.x} y={p.y} width={106} height={34} rx={8} fill={colors.BG} stroke={colors.GRID} strokeDasharray="4 4" opacity={0.7} />;
            })}
            <TaskCard label="task · f2" color={FIBER_COLORS[1]} slotIdx={0} inU={q2U} outU={d2} />
            <TaskCard label="task · f3" color={FIBER_COLORS[2]} slotIdx={idxT3} inU={q3U} outU={d3} />
            <TaskCard label="cont · f1" color={FIBER_COLORS[0]} slotIdx={idxT1} inU={q1U} outU={d1} />
            <TaskCard label="cont · f2" color={FIBER_COLORS[1]} slotIdx={idxT2b} inU={q2bU} outU={dB} />
            <TaskCard label="resume · f3" color={FIBER_COLORS[2]} slotIdx={idxTR} inU={qRU} outU={dR} />
          </g>

          {/* the macrotask tick source */}
          <g opacity={queueU}>
            <rect x={TICK_CHIP.x} y={TICK_CHIP.y - 18} width={128} height={36} rx={9} fill={colors.BG} stroke={colors.SECONDARY} />
            <text x={TICK_CHIP.x + 64} y={TICK_CHIP.y + 5} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>
              setImmediate
            </text>
          </g>
          <TickPulse d={d2} />
          <TickPulse d={d3} />
          <TickPulse d={d1} />
          <TickPulse d={dB} />
          <TickPulse d={dR} />

          {/* the park zone */}
          <g opacity={clamp01(asyncU * 2) * (timerU >= 1 && dR > 0.5 ? 0.35 : 1)}>
            <rect x={PARK.x} y={PARK.y} width={PARK.w} height={PARK.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeDasharray="6 5" />
            <text x={PARK.x + 16} y={PARK.y + 24} fill={colors.MUTED} fontSize={12.5}>
              parked — waiting on a callback
            </text>
            {/* timer arc */}
            <circle cx={PARK.x + 236} cy={PARK.y + 72} r={24} fill="none" stroke={colors.GRID} strokeWidth={3} />
            <circle
              cx={PARK.x + 236}
              cy={PARK.y + 72}
              r={24}
              fill="none"
              stroke={fireU > 0.3 ? colors.POSITIVE : colors.WARM}
              strokeWidth={3}
              strokeDasharray={`${timerU * 150.8} 150.8`}
              transform={`rotate(-90 ${PARK.x + 236} ${PARK.y + 72})`}
            />
            {fireU > 0.02 && (
              <text x={PARK.x + 236} y={PARK.y + 78} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700} opacity={fireU}>
                ✓
              </text>
            )}
          </g>
        </g>

        {/* runSync coda */}
        <g opacity={codaU}>
          <rect x={CODA.x} y={CODA.y} width={CODA.w} height={CODA.h} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={CODA.x + 24} y={CODA.y + 36} fill={colors.TEXT} fontSize={16} fontWeight={700}>
            Effect.runSync
          </text>
          <text x={CODA.x + CODA.w - 22} y={CODA.y + 36} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            MixedScheduler("sync")
          </text>
          {/* mini queue that flushes in one go */}
          {[0, 1, 2].map((i) => {
            const gone = clamp01(flushU * 3 - i);
            return (
              <g key={i} opacity={1 - gone}>
                <rect x={CODA.x + 30 + i * 120 + gone * 60} y={CODA.y + 76} width={104} height={34} rx={8} fill={colors.BG} stroke={colors.GRID} />
                <text x={CODA.x + 82 + i * 120 + gone * 60} y={CODA.y + 98} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                  task
                </text>
              </g>
            );
          })}
          <text x={CODA.x + 24} y={CODA.y + 150} fill={flushU > 0.9 ? colors.POSITIVE : colors.MUTED} fontSize={13.5} fontFamily={MONO}>
            {flushU > 0.9 ? 'dispatcher.flush() → queue empty → Exit' : 'dispatcher.flush()'}
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
