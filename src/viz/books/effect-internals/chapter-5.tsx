// The Promise to Clean Up
//
// Grounding: packages/effect/src/internal/effect.ts — onExitPrimitive (pushes
// itself; its ensureCont raises the interruption mask while the finalizer
// runs; contA/contE run the finalizer then return the ORIGINAL exit),
// ensuring (= onExit), acquireUseRelease (uninterruptibleMask around acquire
// and release, restore(use(a)) in the middle), acquireRelease (files the
// release into the Scope via scopeAddFinalizerExit), Effect.scoped / scopeUse
// (one onExit frame at the boundary that calls scopeCloseUnsafe),
// scopeCloseUnsafe + scopeCloseFinalizers (Map of finalizers, iterated in
// REVERSE insertion order, "sequential" strategy by default).
//
// Centerpiece: three acquisitions file releases into a Scope panel; the
// interrupt from chapter four strikes mid-use; the exit climbs the stack, the
// boundary frame closes the scope last-in-first-out under the shield, and the
// very same exit leaves unchanged. Ends with the whole-book recap on a quiet
// stage.
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

const MASK = { x: 48, y: 116, w: 264, h: 208 } as const;
const PANEL = { x: 356, y: 96, w: 420, h: 452 } as const;
const SLOT = { x: 388, y: 180, w: 208, h: 74 } as const;
const SLOT_C = { x: SLOT.x + SLOT.w / 2, y: SLOT.y + SLOT.h / 2 } as const;
const STACK_X = 632;
const STACK_W = 132;
const STACK_H = 46;
const stackY = (i: number): number => 470 - i * 56;
const SCOPE = { x: 856, y: 110, w: 350, h: 264 } as const;
const TRAY = { x: 856, y: 410, w: 350, h: 74 } as const;

const CAM_WIDE: CameraState = { x: 640, y: 350, k: 1.02 };
const CAM_MACHINE: CameraState = { x: 620, y: 320, k: 1.2 };
const CAM_SCOPE: CameraState = { x: 900, y: 300, k: 1.18 };

const RESOURCES = ['conn', 'file', 'lock'] as const;

// current-slot contents
const CUR: Array<{ label: string; sub: string; color: string }> = [
  { label: 'Sync', sub: 'use: do the work', color: colors.WARM }, // 0
  { label: 'Failure', sub: 'Interrupt · by fiber 2', color: colors.NEGATIVE }, // 1
];

const RECAP = [
  { n: '1', text: 'a program is data' },
  { n: '2', text: 'a loop and a stack' },
  { n: '3', text: 'a budget shares the thread' },
  { n: '4', text: 'interruption is a failure' },
  { n: '5', text: 'finalizers always run' },
] as const;

// ---------------------------------------------------------------------------
// Timeline (~100s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_MACHINE, cameraInterp);

  const machU = tl.channel('machU', 0);
  const spinU = tl.channel('spinU', 0);
  const demoU = tl.channel('demoU', 0); // the demo OnExit frame
  const passG = tl.channel('passG', 0); // a success exit passes through
  const passR = tl.channel('passR', 0); // a failure exit passes through
  const relFlash = tl.channel('relFlash', 0); // "finalizer runs" chip (0..2)
  const shieldG = tl.channel('shieldG', 0); // mini shield on the frame
  const maskU = tl.channel('maskU', 0); // acquireUseRelease anatomy
  const restoreU = tl.channel('restoreU', 0); // highlight the restored middle
  const rewindU = tl.channel('rewindU', 0); // clear the demo
  const scopeU = tl.channel('scopeU', 0); // the Scope panel
  const acqU = tl.channel('acqU', 0); // 0..3 — releases filed into the scope
  const boundU = tl.channel('boundU', 0); // boundary frame + use frame push
  const strikeU = tl.channel('strikeU', 0); // the interrupt pulse arrives
  const curK = tl.channel('curK', 0);
  const skipW = tl.channel('skipW', 0); // the use frame is discarded
  const climbU = tl.channel('climbU', 0); // the exit bubble climbs (0..3)
  const peelU = tl.channel('peelU', 0); // 0..3 — scope rows peel in reverse
  const exitU = tl.channel('exitU', 0); // the exit lands in the tray
  const recapU = tl.channel('recapU', 0); // 0..5 recap cards
  const dimU = tl.channel('dimU', 0);

  // — beat 1 · the promise —
  tl.caption({
    at: 0.5,
    dur: 6.8,
    text: 'When you acquire a resource in Effect, you sign a promise: release will run. On success, on failure — and after last chapter, even on interruption.',
  });
  tl.tween(machU, 1, { at: 0.7, dur: 1.3, ease: ease.draw });
  tl.tween(spinU, 16, { at: 1.0, dur: 96, ease: ease.linear });
  tl.hold(7.3, 0.5);

  // — beat 2 · the frame that catches everything —
  tl.caption({
    at: 7.8,
    dur: 6.6,
    text: "The promise is a stack frame. An on exit frame sits in the fiber's stack and catches every exit that climbs past it — both channels, no exceptions.",
  });
  tl.tween(demoU, 1, { at: 8.4, dur: 0.8, ease: ease.enter });
  tl.tween(passG, 1, { at: 9.6, dur: 1.6, ease: ease.move });
  tl.tween(relFlash, 1, { at: 10.6, dur: 0.5, ease: ease.pop });
  tl.tween(passR, 1, { at: 12.0, dur: 1.6, ease: ease.move });
  tl.tween(relFlash, 2, { at: 13.0, dur: 0.5, ease: ease.pop });
  tl.hold(14.4, 0.5);

  // — beat 3 · the shield during cleanup —
  tl.caption({
    at: 14.9,
    dur: 6.2,
    text: 'Before it runs your finalizer, it raises the interruption shield. A cleanup that could itself be cut in half would be no promise at all.',
  });
  tl.tween(shieldG, 1, { at: 15.7, dur: 0.8, ease: ease.pop });
  tl.hold(21.1, 0.5);

  // — beat 4 · the leak window —
  tl.caption({
    at: 21.6,
    dur: 7.6,
    text: 'One leak remains: an interrupt landing after the resource is acquired but before its release is registered. So acquire use release masks the whole sandwich — and restores only the middle.',
  });
  tl.tween(cam, CAM_WIDE, { at: 21.8, dur: 1.4, ease: ease.move });
  tl.tween(maskU, 1, { at: 22.6, dur: 1.1, ease: ease.draw });
  tl.hold(29.2, 0.5);

  // — beat 5 · only use is interruptible —
  tl.caption({
    at: 29.7,
    dur: 6.4,
    text: 'Your work — the use — stays interruptible. The bookkeeping on either side does not. That asymmetry is the entire resource safety story.',
  });
  tl.tween(restoreU, 1, { at: 30.3, dur: 0.7, ease: ease.pop });
  tl.hold(36.1, 0.5);

  // — beat 6 · the scope collects —
  tl.caption({
    at: 36.6,
    dur: 7.0,
    text: 'Scale it up. Each acquisition files its release into a scope — a map of finalizers, remembered in the order you acquired them.',
  });
  tl.tween(rewindU, 1, { at: 36.8, dur: 0.7, ease: ease.move });
  tl.tween(shieldG, 0, { at: 36.8, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_SCOPE, { at: 37.0, dur: 1.4, ease: ease.move });
  tl.tween(scopeU, 1, { at: 37.6, dur: 0.9, ease: ease.enter });
  tl.tween(acqU, 3, { at: 38.6, dur: 3.4, ease: ease.linear });
  tl.hold(43.6, 0.5);

  // — beat 7 · the boundary —
  tl.caption({
    at: 44.1,
    dur: 6.2,
    text: 'The scoped boundary is itself one on exit frame. Whenever any exit crosses it — any exit at all — the scope closes.',
  });
  tl.tween(cam, CAM_MACHINE, { at: 44.3, dur: 1.3, ease: ease.move });
  tl.tween(boundU, 2, { at: 45.0, dur: 1.6, ease: ease.linear });
  tl.hold(50.3, 0.5);

  // — beat 8 · the strike —
  tl.caption({
    at: 50.8,
    dur: 5.8,
    text: 'Mid work, the interrupt from last chapter strikes. Watch the exit climb.',
  });
  tl.tween(strikeU, 1, { at: 51.6, dur: 1.2, ease: ease.move });
  tl.set(curK, 1, 52.8);
  tl.tween(skipW, 1, { at: 53.6, dur: 1.0, ease: ease.move });
  tl.tween(climbU, 1, { at: 54.6, dur: 1.0, ease: ease.move });
  tl.hold(56.1, 0.5);

  // — beat 9 · reverse, under the shield —
  tl.caption({
    at: 56.6,
    dur: 8.0,
    text: 'The scope closes in reverse: last acquired, first released — each finalizer running to completion under the shield. Then the frame hands the very same exit onward.',
  });
  tl.tween(cam, CAM_SCOPE, { at: 56.8, dur: 1.3, ease: ease.move });
  tl.tween(peelU, 3, { at: 57.8, dur: 4.8, ease: ease.linear });
  tl.tween(climbU, 2, { at: 63.0, dur: 1.0, ease: ease.move });
  tl.hold(64.4, 0.4);

  // — beat 10 · observed, not replaced —
  tl.caption({
    at: 64.8,
    dur: 6.6,
    text: 'Finalizers observe the exit — they never replace it. The interruption that arrived is the interruption that leaves, cleanup receipts and all.',
  });
  tl.tween(climbU, 3, { at: 65.6, dur: 1.2, ease: ease.move });
  tl.tween(exitU, 1, { at: 66.8, dur: 0.8, ease: ease.enter });
  tl.hold(71.2, 0.6);

  // — beat 11 · the recap —
  tl.caption({
    at: 71.8,
    dur: 9.4,
    text: 'And that is the runtime. A program is data. A fiber walks it with a loop and a stack. A budget shares the thread. Interruption is a failure with manners. And finalizers always run. No magic left.',
  });
  tl.tween(dimU, 1, { at: 72.0, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 72.0, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 5, { at: 73.2, dur: 5.6, ease: ease.linear });
  tl.hold(81.4, 2.0);

  return {
    tl,
    cam,
    machU,
    spinU,
    demoU,
    passG,
    passR,
    relFlash,
    shieldG,
    maskU,
    restoreU,
    rewindU,
    scopeU,
    acqU,
    boundU,
    strikeU,
    curK,
    skipW,
    climbU,
    peelU,
    exitU,
    recapU,
    dimU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const machU = s.get(scene.machU);
  const spinU = s.get(scene.spinU);
  const demoU = s.get(scene.demoU);
  const passG = s.get(scene.passG);
  const passR = s.get(scene.passR);
  const relFlash = s.get(scene.relFlash);
  const shieldG = s.get(scene.shieldG);
  const maskU = s.get(scene.maskU);
  const restoreU = s.get(scene.restoreU);
  const rewindU = s.get(scene.rewindU);
  const scopeU = s.get(scene.scopeU);
  const acqU = s.get(scene.acqU);
  const boundU = s.get(scene.boundU);
  const strikeU = s.get(scene.strikeU);
  const curK = Math.round(s.get(scene.curK));
  const skipW = s.get(scene.skipW);
  const climbU = s.get(scene.climbU);
  const peelU = s.get(scene.peelU);
  const exitU = s.get(scene.exitU);
  const recapU = s.get(scene.recapU);
  const dimU = s.get(scene.dimU);

  const mainOp = 1 - 0.88 * dimU;
  const cur = CUR[Math.min(curK, CUR.length - 1)];
  const ang = spinU * Math.PI * 2;
  const dotX = SLOT_C.x + 128 * Math.cos(ang);
  const dotY = SLOT_C.y + 54 * Math.sin(ang);

  // demo pass bubbles travel bottom→top past the demo frame at stackY(0)
  const passPos = (u: number) => ({
    x: STACK_X + STACK_W / 2,
    y: 560 - u * 300,
  });
  const pg = passPos(passG);
  const pr = passPos(passR);

  // the climbing exit: slot → use frame (skipped) → boundary frame → tray
  const climbPos = (() => {
    const pts = [
      { x: SLOT_C.x, y: SLOT_C.y },
      { x: STACK_X + STACK_W / 2, y: stackY(1) + STACK_H / 2 },
      { x: STACK_X + STACK_W / 2, y: stackY(0) + STACK_H / 2 },
      { x: TRAY.x + 40, y: TRAY.y + 36 },
    ];
    const f = clamp01(climbU / 3) * (pts.length - 1);
    const i = Math.min(Math.floor(f), pts.length - 2);
    const t = f - i;
    return {
      x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
      y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
    };
  })();

  const scopeClosed = peelU > 2.9;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* acquireUseRelease anatomy */}
        <g opacity={maskU * mainOp}>
          <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={MASK.x + 18} y={MASK.y + 28} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
            acquireUseRelease
          </text>
          <text x={MASK.x + 18} y={MASK.y + 46} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
            uninterruptibleMask
          </text>
          {(['acquire', 'use', 'release'] as const).map((seg, i) => {
            const masked = i !== 1;
            const hot = !masked && restoreU > 0.5;
            return (
              <g key={seg}>
                <rect
                  x={MASK.x + 18}
                  y={MASK.y + 60 + i * 46}
                  width={MASK.w - 36}
                  height={36}
                  rx={8}
                  fill={colors.BG}
                  stroke={masked ? colors.WARM : hot ? colors.POSITIVE : colors.GRID}
                  strokeWidth={masked || hot ? 1.8 : 1.2}
                />
                <text x={MASK.x + 34} y={MASK.y + 83 + i * 46} fill={masked ? colors.WARM : colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                  {seg}
                </text>
                <text x={MASK.x + MASK.w - 32} y={MASK.y + 83 + i * 46} textAnchor="end" fill={masked ? colors.WARM : colors.POSITIVE} fontSize={10.5} fontFamily={MONO}>
                  {masked ? 'shielded' : 'restore'}
                </text>
              </g>
            );
          })}
        </g>

        {/* the fiber machine */}
        <g opacity={machU * mainOp}>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={PANEL.x + 24} y={PANEL.y + 32} fill={colors.TEXT} fontSize={15.5} fontWeight={700}>
            FiberImpl · runLoop
          </text>
          <text x={PANEL.x + PANEL.w - 20} y={PANEL.y + 32} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            internal/effect.ts
          </text>
          <ellipse cx={SLOT_C.x} cy={SLOT_C.y} rx={126} ry={54} fill="none" stroke={colors.GRID} strokeDasharray="3 6" />
          <circle cx={dotX} cy={dotY} r={5} fill={colors.SECONDARY} />
          <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={10} fill={colors.BG} stroke={cur.color} strokeWidth={1.8} />
          <text x={SLOT.x + SLOT.w / 2} y={SLOT.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            current
          </text>
          <text x={SLOT.x + 16} y={SLOT.y + 30} fill={cur.color} fontSize={14} fontFamily={MONO} fontWeight={700}>
            {cur.label}
          </text>
          <text x={SLOT.x + 16} y={SLOT.y + 54} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
            {cur.sub}
          </text>

          {/* the stack */}
          <text x={STACK_X + STACK_W / 2} y={stackY(1) - 16} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            _stack
          </text>

          {/* demo OnExit frame (beats 2–3) */}
          {demoU > 0.01 && rewindU < 0.99 && (
            <g opacity={demoU * (1 - rewindU)}>
              <rect
                x={STACK_X}
                y={stackY(0)}
                width={STACK_W}
                height={STACK_H}
                rx={9}
                fill={colors.PANEL}
                stroke={shieldG > 0.3 ? colors.WARM : colors.TEAL}
                strokeWidth={1.8}
              />
              <text x={STACK_X + 10} y={stackY(0) + 20} fill={colors.TEAL} fontSize={11} fontFamily={MONO} fontWeight={600}>
                OnExit
              </text>
              <text x={STACK_X + 10} y={stackY(0) + 36} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                run finalizer
              </text>
              {/* both ports — it catches everything */}
              <circle cx={STACK_X + STACK_W - 12} cy={stackY(0) + 14} r={5} fill={colors.POSITIVE} />
              <circle cx={STACK_X + STACK_W - 12} cy={stackY(0) + 32} r={5} fill={colors.NEGATIVE} />
              {shieldG > 0.02 && (
                <g opacity={shieldG}>
                  <rect x={STACK_X - 6} y={stackY(0) - 6} width={STACK_W + 12} height={STACK_H + 12} rx={12} fill="none" stroke={colors.WARM} strokeWidth={2} />
                  <text x={STACK_X + STACK_W + 14} y={stackY(0) + 16} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                    interruptible:
                  </text>
                  <text x={STACK_X + STACK_W + 14} y={stackY(0) + 31} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                    false while it runs
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the real stack for the finale: boundary + use */}
          {(() => {
            const fdefs = [
              { name: 'OnExit', tag: 'close scope', color: colors.TEAL, i: 0 },
              { name: 'OnSuccess', tag: 'after use', color: colors.TEXT, i: 1 },
            ];
            return fdefs.map((f) => {
              const present = win(boundU, 2, f.i, 1);
              const skipT = f.i === 1 ? skipW : 0;
              const vis = present * (1 - skipT);
              if (vis <= 0.01) return null;
              const busy = f.i === 0 && climbU > 0.9 && climbU < 2.1;
              return (
                <g key={f.i} opacity={vis} transform={`translate(${skipT * 220} ${(1 - present) * 14})`}>
                  <rect x={STACK_X} y={stackY(f.i)} width={STACK_W} height={STACK_H} rx={9} fill={colors.PANEL} stroke={busy ? colors.WARM : f.i === 0 ? colors.TEAL : colors.GRID} strokeWidth={busy ? 2.2 : 1.4} />
                  <text x={STACK_X + 10} y={stackY(f.i) + 20} fill={f.i === 0 ? colors.TEAL : colors.TEXT} fontSize={11} fontFamily={MONO} fontWeight={600}>
                    {f.name}
                  </text>
                  <text x={STACK_X + 10} y={stackY(f.i) + 36} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                    {f.tag}
                  </text>
                  {f.i === 0 && (
                    <>
                      <circle cx={STACK_X + STACK_W - 12} cy={stackY(0) + 14} r={5} fill={colors.POSITIVE} />
                      <circle cx={STACK_X + STACK_W - 12} cy={stackY(0) + 32} r={5} fill={colors.NEGATIVE} />
                    </>
                  )}
                  {f.i === 1 && <circle cx={STACK_X + STACK_W - 12} cy={stackY(1) + 14} r={5} fill={colors.POSITIVE} />}
                  {skipT > 0.15 && (
                    <text x={STACK_X + STACK_W + 12} y={stackY(1) + 30} fill={colors.NEGATIVE} fontSize={16} fontWeight={700}>
                      ✕
                    </text>
                  )}
                  {busy && (
                    <rect x={STACK_X - 6} y={stackY(0) - 6} width={STACK_W + 12} height={STACK_H + 12} rx={12} fill="none" stroke={colors.WARM} strokeWidth={2} />
                  )}
                </g>
              );
            });
          })()}

          {/* demo pass bubbles */}
          {passG > 0.01 && passG < 0.99 && <circle cx={pg.x} cy={pg.y} r={9} fill={colors.POSITIVE} opacity={0.9} />}
          {passR > 0.01 && passR < 0.99 && <circle cx={pr.x} cy={pr.y} r={9} fill={colors.NEGATIVE} opacity={0.9} />}
          {relFlash % 1 > 0.05 && relFlash % 1 < 0.95 && relFlash > 0 && relFlash < 2.01 && (
            <g opacity={0.9}>
              <rect x={STACK_X - 40} y={stackY(0) + STACK_H + 14} width={210} height={28} rx={7} fill={colors.BG} stroke={colors.TEAL} />
              <text x={STACK_X + 65} y={stackY(0) + STACK_H + 33} textAnchor="middle" fill={colors.TEAL} fontSize={11.5} fontFamily={MONO}>
                finalizer ran · exit passed on
              </text>
            </g>
          )}
        </g>

        {/* the interrupt strike */}
        {strikeU > 0.01 && strikeU < 0.99 && (
          <circle cx={120 + (SLOT_C.x - 120) * strikeU} cy={620 - (620 - SLOT_C.y) * strikeU} r={11} fill={colors.NEGATIVE} opacity={0.92} />
        )}

        {/* the climbing exit */}
        {climbU > 0.05 && climbU < 2.95 && (
          <g>
            <circle cx={climbPos.x} cy={climbPos.y} r={10} fill={colors.NEGATIVE} opacity={0.95} />
            <text x={climbPos.x + 18} y={climbPos.y + 4} fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
              Exit
            </text>
          </g>
        )}

        {/* the Scope */}
        <g opacity={scopeU * mainOp}>
          <rect x={SCOPE.x} y={SCOPE.y} width={SCOPE.w} height={SCOPE.h} rx={14} fill={colors.PANEL} stroke={scopeClosed ? colors.GRID : colors.TEAL} strokeWidth={1.5} />
          <text x={SCOPE.x + 20} y={SCOPE.y + 30} fill={colors.TEXT} fontSize={15} fontWeight={700}>
            Scope
          </text>
          <text x={SCOPE.x + SCOPE.w - 18} y={SCOPE.y + 30} textAnchor="end" fill={scopeClosed ? colors.NEGATIVE : colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            {scopeClosed ? 'state: Closed' : 'state: Open'}
          </text>
          <text x={SCOPE.x + 20} y={SCOPE.y + 52} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            strategy: "sequential" · finalizers: Map
          </text>
          {RESOURCES.map((r, i) => {
            const inU = win(acqU, 3, i, 1);
            // peel order is REVERSE: peelU 0→1 removes lock (i=2), 1→2 file, 2→3 conn
            const peel = clamp01(peelU - (2 - i));
            const vis = inU * (1 - peel);
            if (vis <= 0.01) return null;
            return (
              <g key={r} opacity={vis} transform={`translate(${peel * 60} 0)`}>
                <rect x={SCOPE.x + 20} y={SCOPE.y + 68 + i * 56} width={SCOPE.w - 40} height={44} rx={9} fill={colors.BG} stroke={peel > 0.05 ? colors.WARM : colors.GRID} />
                <text x={SCOPE.x + 36} y={SCOPE.y + 87 + i * 56} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                  key {i + 1} → release {r}
                </text>
                <text x={SCOPE.x + 36} y={SCOPE.y + 104 + i * 56} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                  acquireRelease · filed at acquisition
                </text>
              </g>
            );
          })}
          {/* peel receipts */}
          {RESOURCES.map((r, i) => {
            const peel = clamp01(peelU - (2 - i));
            if (peel < 0.95) return null;
            return (
              <text key={r} x={SCOPE.x + SCOPE.w - 20} y={SCOPE.y + 96 + i * 56} textAnchor="end" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                ✓ released
              </text>
            );
          })}
          {peelU > 0.05 && peelU < 3 && (
            <text x={SCOPE.x + 20} y={SCOPE.y + SCOPE.h - 16} fill={colors.WARM} fontSize={11} fontFamily={MONO}>
              closing in reverse — scopeCloseUnsafe(exit)
            </text>
          )}
        </g>

        {/* the exit tray */}
        <g opacity={exitU * mainOp}>
          <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={TRAY.h} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
          <text x={TRAY.x + 18} y={TRAY.y + 30} fill={colors.NEGATIVE} fontSize={13.5} fontFamily={MONO} fontWeight={700}>
            Exit · Failure · Interrupt
          </text>
          <text x={TRAY.x + 18} y={TRAY.y + 52} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
            unchanged · resources open: 0
          </text>
        </g>

        {/* the recap — on its own opaque backdrop, quiet stage */}
        {recapU > 0.02 && (
          <g>
            <rect x={70} y={230} width={1140} height={200} rx={18} fill={colors.BG} stroke={colors.GRID} opacity={0.96} />
            {RECAP.map((r, i) => {
              const o = clamp01(recapU - i);
              if (o <= 0.01) return null;
              return (
                <g key={r.n} opacity={o} transform={`translate(0 ${(1 - o) * 12})`}>
                  <rect x={92 + i * 224} y={258} width={204} height={144} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
                  <text x={194 + i * 224} y={306} textAnchor="middle" fill={colors.ACCENT} fontSize={30} fontFamily={MONO} fontWeight={700}>
                    {r.n}
                  </text>
                  <text x={194 + i * 224} y={344} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                    {r.text.split(' ').slice(0, 3).join(' ')}
                  </text>
                  <text x={194 + i * 224} y={364} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                    {r.text.split(' ').slice(3).join(' ')}
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
