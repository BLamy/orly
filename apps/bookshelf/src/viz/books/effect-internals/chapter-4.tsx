// Interruption Is a Failure
//
// Grounding: packages/effect/src/internal/effect.ts — FiberImpl.interruptUnsafe
// (merge causeInterrupt(fiberId) into _interruptedCause; if fiber.interruptible,
// evaluate(failCause(...)) — interruption IS a failure injected into the loop),
// uninterruptible / uninterruptibleMask (flip fiber.interruptible, push the
// setInterruptibleTrue restore frame), setInterruptible's ensureCont (restore
// the flag; if _interruptedCause is pending, fail with it at the boundary),
// fiberInterrupt / fiberInterruptAs (interruptUnsafe then fiberAwait — the
// caller waits for the target's exit).
//
// Centerpiece: the fiber machine from chapter two, now with an interruption
// shield and a latch. Pulse one arrives with the shield down and simply
// becomes a failure. Pulse two hits a raised shield, coils into the
// _interruptedCause latch, and fires the instant the restore frame pops.
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
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const F2 = { x: 62, y: 150, w: 252, h: 108 } as const;
const PANEL = { x: 400, y: 96, w: 430, h: 452 } as const;
const SLOT = { x: 432, y: 180, w: 214, h: 74 } as const;
const SLOT_C = { x: SLOT.x + SLOT.w / 2, y: SLOT.y + SLOT.h / 2 } as const;
const STACK_X = 684;
const STACK_W = 134;
const STACK_H = 46;
const stackY = (i: number): number => 470 - i * 54;
const LATCH = { x: 880, y: 206, w: 316, h: 96 } as const;
const FLAG = { x: PANEL.x + 24, y: PANEL.y + 396 } as const;

const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.02 };
const CAM_MACHINE: CameraState = { x: 640, y: 330, k: 1.2 };
const CAM_LATCH: CameraState = { x: 840, y: 300, k: 1.22 };

function along(pts: ReadonlyArray<{ x: number; y: number }>, u: number): { x: number; y: number } {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return {
    x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
    y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
  };
}

// pulse one: straight into the current slot (shield down)
const PULSE1_PATH = [
  { x: F2.x + F2.w - 8, y: F2.y + 54 },
  { x: 370, y: 216 },
  { x: SLOT_C.x, y: SLOT_C.y },
] as const;
// pulse two: bounces off the shield, coils into the latch
const PULSE2_PATH = [
  { x: F2.x + F2.w - 8, y: F2.y + 54 },
  { x: 372, y: 216 },
  { x: PANEL.x - 10, y: 260 },
  { x: PANEL.x + 60, y: 60 },
  { x: LATCH.x + 60, y: LATCH.y + 58 },
] as const;
// the latched cause discharging into the current slot
const DISCHARGE_PATH = [
  { x: LATCH.x + 60, y: LATCH.y + 58 },
  { x: 870, y: 140 },
  { x: SLOT_C.x, y: SLOT_C.y },
] as const;

// current-slot contents
const CUR: Array<{ label: string; sub: string; color: string }> = [
  { label: 'Sync', sub: 'step: write chunk', color: colors.WARM }, // 0
  { label: 'Failure', sub: 'Interrupt · by fiber 2', color: colors.NEGATIVE }, // 1
  { label: 'Sync', sub: 'critical: commit write', color: colors.WARM }, // 2
  { label: 'Failure', sub: 'Interrupt · by fiber 2', color: colors.NEGATIVE }, // 3
];

// scenario 1 stack: two plain success frames; scenario 2: restore frame + work
const FRAMES_A = [
  { name: 'OnSuccess', tag: 'step 2', special: false },
  { name: 'OnSuccess', tag: 'step 3', special: false },
] as const;
const FRAMES_B = [
  { name: 'SetInterruptible', tag: 'restore: true', special: true },
  { name: 'OnSuccess', tag: 'finish write', special: false },
] as const;

// ---------------------------------------------------------------------------
// Timeline (~90s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const f2U = tl.channel('f2U', 0);
  const machU = tl.channel('machU', 0);
  const spinU = tl.channel('spinU', 0);
  const opsN = tl.channel('opsN', 0);
  const curK = tl.channel('curK', 0); // index into CUR
  const stackA = tl.channel('stackA', 0); // scenario-1 frames push
  const askU = tl.channel('askU', 0); // interrupt chip on fiber 2
  const pulse1 = tl.channel('pulse1', 0);
  const skip1 = tl.channel('skip1', 0); // 0..2 frames discarded
  const exit1U = tl.channel('exit1U', 0);
  const rewindU = tl.channel('rewindU', 0); // reset for scenario 2
  const stackB = tl.channel('stackB', 0); // restore frame + work frame push
  const flagU = tl.channel('flagU', 0); // 0 = interruptible, 1 = masked
  const shieldU = tl.channel('shieldU', 0);
  const pulse2 = tl.channel('pulse2', 0);
  const latchU = tl.channel('latchU', 0); // the cause sits latched
  const workPop = tl.channel('workPop', 0); // shielded work completes
  const popS = tl.channel('popS', 0); // restore frame pops
  const dischargeU = tl.channel('dischargeU', 0);
  const trioU = tl.channel('trioU', 0); // flag + frame + latch highlight
  const exitBackU = tl.channel('exitBackU', 0); // exit travels to fiber 2
  const dimU = tl.channel('dimU', 0);
  const teaseU = tl.channel('teaseU', 0); // the open connection, unclosed

  // — beat 1 · the ask —
  tl.caption({
    at: 0.5,
    dur: 7.2,
    text: "Fibers wouldn't be interesting if you couldn't stop them. Fiber two decides fiber one's work no longer matters and asks it to stop. What does stop even mean, mid program?",
  });
  tl.tween(machU, 1, { at: 0.7, dur: 1.3, ease: ease.draw });
  tl.tween(f2U, 1, { at: 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(stackA, 2, { at: 1.8, dur: 1.6, ease: ease.linear });
  tl.tween(spinU, 15, { at: 1.0, dur: 88, ease: ease.linear });
  tl.tween(opsN, 620, { at: 1.4, dur: 13, ease: ease.linear });
  tl.hold(7.7, 0.5);

  // — beat 2 · the interrupt is a value —
  tl.caption({
    at: 8.2,
    dur: 6.4,
    text: 'The ask is concrete: an interrupt is a cause — a failure value that records which fiber requested it — handed to the target fiber.',
  });
  tl.tween(askU, 1, { at: 8.6, dur: 0.7, ease: ease.pop });
  tl.hold(14.6, 0.5);

  // — beat 3 · shield down: inject —
  tl.caption({
    at: 15.1,
    dur: 7.0,
    text: 'If the target is interruptible, the runtime injects that cause as its current instruction. And the loop simply starts failing.',
  });
  tl.tween(cam, CAM_MACHINE, { at: 15.3, dur: 1.3, ease: ease.move });
  tl.tween(pulse1, 1, { at: 16.2, dur: 1.6, ease: ease.move });
  tl.set(curK, 1, 17.8);
  tl.tween(skip1, 2, { at: 18.6, dur: 2.2, ease: ease.move });
  tl.hold(22.1, 0.5);

  // — beat 4 · no secret kill path —
  tl.caption({
    at: 22.6,
    dur: 6.6,
    text: 'There is no secret kill switch. Interruption reuses the failure machinery from chapter two — the same stack walk, skipping the same success frames.',
  });
  tl.tween(exit1U, 1, { at: 23.4, dur: 0.8, ease: ease.enter });
  tl.hold(29.2, 0.6);

  // — beat 5 · the mask —
  tl.caption({
    at: 29.8,
    dur: 7.6,
    text: 'But some work must never be cut in half. Marking a region uninterruptible flips one flag on the fiber and pushes a restore frame onto the stack. That is the entire mask.',
  });
  tl.tween(rewindU, 1, { at: 30.0, dur: 0.9, ease: ease.move });
  tl.tween(exit1U, 0, { at: 30.0, dur: 0.7, ease: ease.enter });
  tl.set(curK, 2, 31.0);
  tl.tween(stackB, 2, { at: 31.4, dur: 1.8, ease: ease.linear });
  tl.tween(flagU, 1, { at: 32.4, dur: 0.6, ease: ease.move });
  tl.tween(shieldU, 1, { at: 33.2, dur: 1.0, ease: ease.draw });
  tl.tween(opsN, 1100, { at: 31, dur: 20, ease: ease.linear });
  tl.hold(36.8, 0.6);

  // — beat 6 · the pulse waits —
  tl.caption({
    at: 37.4,
    dur: 7.2,
    text: "Now the same pulse arrives — and bounces. The cause isn't dropped. It is latched onto the fiber, remembered, waiting for the shield to drop.",
  });
  tl.tween(cam, CAM_LATCH, { at: 37.6, dur: 1.4, ease: ease.move });
  tl.tween(pulse2, 1, { at: 38.4, dur: 2.4, ease: ease.move });
  tl.tween(latchU, 1, { at: 40.6, dur: 0.6, ease: ease.pop });
  tl.hold(44.1, 0.5);

  // — beat 7 · the boundary —
  tl.caption({
    at: 44.6,
    dur: 7.4,
    text: 'The critical work finishes, the restore frame pops, the flag flips back — and the latched interruption fires that very instant, at the boundary.',
  });
  tl.tween(workPop, 1, { at: 45.4, dur: 1.0, ease: ease.move });
  tl.tween(popS, 1, { at: 47.0, dur: 1.0, ease: ease.move });
  tl.tween(flagU, 0, { at: 48.0, dur: 0.5, ease: ease.move });
  tl.tween(shieldU, 0, { at: 48.2, dur: 0.8, ease: ease.move });
  tl.tween(dischargeU, 1, { at: 49.2, dur: 1.2, ease: ease.move });
  tl.set(curK, 3, 50.4);
  tl.tween(latchU, 0, { at: 49.4, dur: 0.8, ease: ease.enter });
  tl.hold(51.6, 0.5);

  // — beat 8 · two frames and a boolean —
  tl.caption({
    at: 52.1,
    dur: 6.8,
    text: 'So interruption only ever lands where the program declared it safe. The safety is not in the scheduler — it is one boolean, one restore frame, and one latch.',
  });
  tl.tween(cam, CAM_MACHINE, { at: 52.3, dur: 1.3, ease: ease.move });
  tl.tween(trioU, 1, { at: 53.4, dur: 0.8, ease: ease.pop });
  tl.hold(58.4, 0.6);

  // — beat 9 · a conversation, not a signal —
  tl.caption({
    at: 59.0,
    dur: 7.4,
    text: "And fiber two? It hasn't moved. Interrupting returns only when the target's exit comes back — stopping a fiber is a conversation with a reply, not a signal into the void.",
  });
  tl.tween(cam, CAM_WIDE, { at: 59.2, dur: 1.4, ease: ease.move });
  tl.tween(trioU, 0, { at: 59.4, dur: 0.6, ease: ease.enter });
  tl.tween(exitBackU, 1, { at: 60.6, dur: 1.8, ease: ease.move });
  tl.hold(66.2, 0.6);

  // — beat 10 · the loose end —
  tl.caption({
    at: 66.8,
    dur: 7.0,
    text: 'One loose end: that critical region opened a connection, and somebody still has to close it — even now. That promise is the final chapter.',
  });
  tl.tween(dimU, 1, { at: 67.0, dur: 1.2, ease: ease.move });
  tl.tween(teaseU, 1, { at: 68.2, dur: 0.9, ease: ease.enter });
  tl.hold(73.4, 1.8);

  return {
    tl,
    cam,
    f2U,
    machU,
    spinU,
    opsN,
    curK,
    stackA,
    askU,
    pulse1,
    skip1,
    exit1U,
    rewindU,
    stackB,
    flagU,
    shieldU,
    pulse2,
    latchU,
    workPop,
    popS,
    dischargeU,
    trioU,
    exitBackU,
    dimU,
    teaseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const f2U = s.get(scene.f2U);
  const machU = s.get(scene.machU);
  const spinU = s.get(scene.spinU);
  const opsN = Math.round(s.get(scene.opsN));
  const curK = Math.round(s.get(scene.curK));
  const stackA = s.get(scene.stackA);
  const askU = s.get(scene.askU);
  const pulse1 = s.get(scene.pulse1);
  const skip1 = s.get(scene.skip1);
  const exit1U = s.get(scene.exit1U);
  const rewindU = s.get(scene.rewindU);
  const stackB = s.get(scene.stackB);
  const flagU = s.get(scene.flagU);
  const shieldU = s.get(scene.shieldU);
  const pulse2 = s.get(scene.pulse2);
  const latchU = s.get(scene.latchU);
  const workPop = s.get(scene.workPop);
  const popS = s.get(scene.popS);
  const dischargeU = s.get(scene.dischargeU);
  const trioU = s.get(scene.trioU);
  const exitBackU = s.get(scene.exitBackU);
  const dimU = s.get(scene.dimU);
  const teaseU = s.get(scene.teaseU);

  const mainOp = 1 - 0.85 * dimU;
  const cur = CUR[Math.min(curK, CUR.length - 1)];
  const scenarioB = rewindU > 0.5;
  const ang = spinU * Math.PI * 2;
  const dotX = SLOT_C.x + 132 * Math.cos(ang);
  const dotY = SLOT_C.y + 56 * Math.sin(ang);
  const p1 = along(PULSE1_PATH, pulse1);
  const p2 = along(PULSE2_PATH, pulse2);
  const pd = along(DISCHARGE_PATH, dischargeU);
  const exitPos = along(
    [
      { x: SLOT_C.x, y: SLOT_C.y },
      { x: 360, y: 170 },
      { x: F2.x + F2.w / 2, y: F2.y - 26 },
    ],
    exitBackU,
  );

  const frames = scenarioB ? FRAMES_B : FRAMES_A;
  const frameState = (i: number) => {
    if (!scenarioB) {
      const present = win(stackA, 2, i, 1);
      const skipT = i === 1 ? clamp01(skip1) : clamp01(skip1 - 1);
      return { present, popT: 0, skipT };
    }
    const present = win(stackB, 2, i, 1);
    const popT = i === 1 ? workPop : popS;
    return { present, popT, skipT: 0 };
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* fiber 2 — the requester */}
        <g opacity={f2U * mainOp}>
          <rect x={F2.x} y={F2.y} width={F2.w} height={F2.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={F2.x + 18} y={F2.y + 28} fill={colors.TEXT} fontSize={14.5} fontWeight={700}>
            FiberImpl · id: 2
          </text>
          <g opacity={askU}>
            <rect x={F2.x + 18} y={F2.y + 46} width={216} height={32} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
            <text x={F2.x + 126} y={F2.y + 67} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
              Fiber.interrupt(fiber1)
            </text>
          </g>
          {exitBackU >= 1 && (
            <text x={F2.x + 18} y={F2.y + 98} fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
              ✓ exit received — resumed
            </text>
          )}
        </g>

        {/* the target machine */}
        <g opacity={machU * mainOp}>
          {/* the shield */}
          <rect
            x={PANEL.x - 10}
            y={PANEL.y - 10}
            width={PANEL.w + 20}
            height={PANEL.h + 20}
            rx={20}
            fill="none"
            stroke={colors.WARM}
            strokeWidth={3}
            opacity={shieldU * 0.9}
          />
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={PANEL.x + 24} y={PANEL.y + 32} fill={colors.TEXT} fontSize={15.5} fontWeight={700}>
            FiberImpl · id: 1
          </text>
          <text x={PANEL.x + PANEL.w - 20} y={PANEL.y + 32} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            internal/effect.ts
          </text>

          {/* current slot + loop dot */}
          <ellipse cx={SLOT_C.x} cy={SLOT_C.y} rx={132} ry={56} fill="none" stroke={colors.GRID} strokeDasharray="3 6" />
          <circle cx={dotX} cy={dotY} r={5} fill={colors.SECONDARY} />
          <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={10} fill={colors.BG} stroke={cur.color} strokeWidth={1.8} />
          <text x={SLOT.x + SLOT.w / 2} y={SLOT.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            current
          </text>
          <text x={SLOT.x + 16} y={SLOT.y + 30} fill={cur.color} fontSize={14.5} fontFamily={MONO} fontWeight={700}>
            {cur.label}
          </text>
          <text x={SLOT.x + 16} y={SLOT.y + 54} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
            {cur.sub}
          </text>

          {/* the stack */}
          <text x={STACK_X + STACK_W / 2} y={stackY(1) - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            _stack
          </text>
          {frames.map((f, i) => {
            const st = frameState(i);
            const vis = st.present * (1 - Math.max(st.popT, st.skipT));
            if (vis <= 0.01) return null;
            const dx = -st.popT * 190 + st.skipT * 230;
            const y = stackY(i);
            const glow = f.special && (trioU > 0.5 || (stackB > 0.8 && popS < 0.1 && shieldU > 0.5));
            return (
              <g key={i} opacity={vis} transform={`translate(${dx} ${(1 - st.present) * 14})`}>
                <rect
                  x={STACK_X}
                  y={y}
                  width={STACK_W}
                  height={STACK_H}
                  rx={9}
                  fill={colors.PANEL}
                  stroke={f.special ? colors.WARM : colors.GRID}
                  strokeWidth={glow ? 2.4 : f.special ? 1.8 : 1.2}
                />
                <text x={STACK_X + 10} y={y + 20} fill={f.special ? colors.WARM : colors.TEXT} fontSize={10.5} fontFamily={MONO} fontWeight={600}>
                  {f.name}
                </text>
                <text x={STACK_X + 10} y={y + 36} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                  {f.tag}
                </text>
                {!f.special && <circle cx={STACK_X + STACK_W - 12} cy={y + 14} r={5} fill={colors.POSITIVE} />}
                {st.skipT > 0.15 && (
                  <text x={STACK_X + STACK_W + 12} y={y + 30} fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                    ✕
                  </text>
                )}
              </g>
            );
          })}

          {/* the interruptible flag */}
          <g>
            <rect
              x={FLAG.x}
              y={FLAG.y}
              width={232}
              height={32}
              rx={8}
              fill={colors.BG}
              stroke={flagU > 0.5 ? colors.WARM : colors.POSITIVE}
              strokeWidth={trioU > 0.5 ? 2.4 : 1.5}
            />
            <text x={FLAG.x + 14} y={FLAG.y + 21} fill={flagU > 0.5 ? colors.WARM : colors.POSITIVE} fontSize={12.5} fontFamily={MONO}>
              interruptible: {flagU > 0.5 ? 'false' : 'true'}
            </text>
          </g>
          {/* ops counter */}
          <text x={FLAG.x + 4} y={FLAG.y + 52} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            ops: {opsN.toLocaleString('en-US')}
          </text>
        </g>

        {/* the latch */}
        <g opacity={machU * mainOp * clamp01(rewindU * 2 + latchU)}>
          <rect
            x={LATCH.x}
            y={LATCH.y}
            width={LATCH.w}
            height={LATCH.h}
            rx={12}
            fill={colors.PANEL}
            stroke={latchU > 0.1 ? colors.NEGATIVE : colors.GRID}
            strokeWidth={trioU > 0.5 ? 2.4 : 1.5}
          />
          <text x={LATCH.x + 16} y={LATCH.y + 26} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            _interruptedCause
          </text>
          {latchU > 0.02 && (
            <g opacity={latchU}>
              <circle cx={LATCH.x + 60} cy={LATCH.y + 58} r={13} fill={colors.NEGATIVE} opacity={0.9} />
              <text x={LATCH.x + 84} y={LATCH.y + 63} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
                Interrupt · by fiber 2
              </text>
            </g>
          )}
          {latchU <= 0.02 && dischargeU <= 0.02 && (
            <text x={LATCH.x + 60} y={LATCH.y + 62} fill={colors.MUTED} fontSize={12} opacity={0.6}>
              empty
            </text>
          )}
        </g>

        {/* traveling pulses */}
        {pulse1 > 0.01 && pulse1 < 0.99 && (
          <g>
            <circle cx={p1.x} cy={p1.y} r={11} fill={colors.NEGATIVE} opacity={0.92} />
            <text x={p1.x} y={p1.y - 18} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
              causeInterrupt
            </text>
          </g>
        )}
        {pulse2 > 0.01 && pulse2 < 0.99 && (
          <g>
            <circle cx={p2.x} cy={p2.y} r={11} fill={colors.NEGATIVE} opacity={0.92} />
            {pulse2 > 0.3 && pulse2 < 0.6 && (
              <text x={p2.x + 20} y={p2.y - 12} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                blocked
              </text>
            )}
          </g>
        )}
        {dischargeU > 0.01 && dischargeU < 0.99 && <circle cx={pd.x} cy={pd.y} r={11} fill={colors.NEGATIVE} opacity={0.92} />}

        {/* scenario-1 exit chip */}
        <g opacity={exit1U * mainOp}>
          <rect x={880} y={340} width={300} height={58} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
          <text x={898} y={364} fill={colors.NEGATIVE} fontSize={13.5} fontFamily={MONO} fontWeight={700}>
            Exit · Failure
          </text>
          <text x={898} y={384} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
            cause: Interrupt
          </text>
        </g>

        {/* the exit traveling home to fiber 2 */}
        {exitBackU > 0.01 && exitBackU < 0.99 && (
          <g>
            <rect x={exitPos.x - 70} y={exitPos.y - 18} width={140} height={36} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
            <text x={exitPos.x} y={exitPos.y + 5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
              Exit · Interrupted
            </text>
          </g>
        )}

        {/* the loose end */}
        <g opacity={teaseU}>
          <rect x={470} y={566} width={340} height={48} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={640} y={586} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
            conn — still open
          </text>
          <text x={640} y={604} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
            who closes this?
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
