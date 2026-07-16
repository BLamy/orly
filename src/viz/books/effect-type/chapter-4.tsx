// The Run Loop
//
// Backing files: packages/effect/src/internal/effect.ts — FiberImpl with
// `_stack: Array<Primitive>` (~532), `runLoop` (~621: while (true) current =
// current[evaluate](fiber)), `getCont` (~664), and the OnSuccess primitive
// whose evaluate pushes itself onto fiber._stack and returns its inner effect
// (~1630); `succeed` IS `exitSucceed` (a leaf tagged "Success").
// packages/effect/src/Effect.ts — runSync (~9219, throws the documented
// "Fiber #0 cannot be resolved synchronously" AsyncFiberException on async
// work), runPromise (~9020), runFork (~8842, the doc example forks a repeating
// logger and interrupts it after 500 ms). packages/effect/src/Exit.ts —
// Exit.Success / Exit.Failure.
//
// Centerpiece: the fiber as a stack machine walking chapter 3's pipeline
// tree — the current pointer descends OnSuccess nodes (each push visible),
// hits the Success(100) leaf, then continuations pop and the value climbs
// back transformed, ending in an Exit card. Then the three doorways:
// runSync, runPromise, runFork.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — description tree on the left, the fiber machine center-right,
// the Exit card on the far right; doorway panels appear on a swept stage.
// ---------------------------------------------------------------------------

const NODE = { w: 260, h: 78 } as const;
const TREE_X = 130;
const ROOT_Y = 130;
const MID_Y = 254;
const LEAF_Y = 378;

const MACH = { x: 560, y: 118, w: 300, h: 420 } as const;
const SLOT = { x: MACH.x + 24, w: MACH.w - 48, h: 44 } as const;
const SLOT0_Y = MACH.y + MACH.h - 76; // bottom slot
const SLOT1_Y = SLOT0_Y - 54;

const EXIT_CARD = { x: 930, y: 230, w: 250, h: 130 } as const;

// doorway panels
const DOOR = { w: 350, h: 260, y: 170 } as const;
const DOOR_X = [85, 465, 845] as const;

// camera marks
const CAM_TREE: CameraState = { x: 330, y: 300, k: 1.3 };
const CAM_MACH: CameraState = { x: 640, y: 330, k: 1.18 };
const CAM_EXIT: CameraState = { x: 950, y: 300, k: 1.34 };
const CAM_DOORS: CameraState = { x: 640, y: 330, k: 1.04 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  treeU: ChannelRef<number>;
  machU: ChannelRef<number>;
  walk: ChannelRef<number>; // descend: pointer root→mid→leaf, pushes
  pops: ChannelRef<number>; // climb: value bubbles up through continuations
  exitU: ChannelRef<number>;
  dim1: ChannelRef<number>; // dims the machine act for the doorways act
  doorsU: ChannelRef<number>;
  syncErrU: ChannelRef<number>;
  promU: ChannelRef<number>;
  forkT: ChannelRef<number>; // 0..1 ≈ 0..700ms on the fork timeline
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 330, k: 1.06 }, cameraInterp);
  const treeU = tl.channel('treeU', 0);
  const machU = tl.channel('machU', 0);
  const walk = tl.channel('walk', 0);
  const pops = tl.channel('pops', 0);
  const exitU = tl.channel('exitU', 0);
  const dim1 = tl.channel('dim1', 1);
  const doorsU = tl.channel('doorsU', 0);
  const syncErrU = tl.channel('syncErrU', 0);
  const promU = tl.channel('promU', 0);
  const forkT = tl.channel('forkT', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · hook —
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A description cannot cook itself. Somewhere, someone has to do the actual work. In Effect, that someone is called a fiber.',
  });
  tl.tween(cam, CAM_TREE, { at: 0.8, dur: 2.0, ease: ease.move });
  tl.hold(6.1, 0.5);

  // — Beat 2 · the tree —
  tl.caption({
    at: 6.8,
    dur: 7.0,
    text: 'Here is last chapter’s pipeline the way the runtime sees it: a tree of primitive nodes, each stamped with an op tag. On success, on success, and a leaf holding the value one hundred.',
  });
  tl.tween(treeU, 1, { at: 7.2, dur: 1.8, ease: ease.draw });
  tl.hold(13.8, 0.4);

  // — Beat 3 · the machine —
  tl.caption({
    at: 14.4,
    dur: 7.0,
    text: 'The fiber is a tiny stack machine. It keeps a current pointer and a stack of continuations, and it runs one loop: evaluate the current node, over and over, until something final falls out.',
  });
  tl.tween(cam, CAM_MACH, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.tween(machU, 1, { at: 15.2, dur: 1.0, ease: ease.enter });
  tl.hold(21.4, 0.4);

  // — Beat 4 · descend and push —
  tl.caption({
    at: 22.0,
    dur: 7.0,
    text: 'Each on success node does two things when evaluated: push itself onto the stack, and hand the loop its inner effect. The machine descends the tree, remembering the way back up.',
  });
  tl.tween(walk, 1, { at: 22.8, dur: 4.6, ease: ease.move });
  tl.hold(29.0, 0.4);

  // — Beat 5 · the leaf, then the climb —
  tl.caption({
    at: 29.6,
    dur: 7.2,
    text: 'At the bottom it finds the leaf: success, one hundred. Now the stack pays off. Pop a continuation, feed it the value, and the answer climbs back, transformed at every step.',
  });
  tl.tween(pops, 1, { at: 30.6, dur: 5.2, ease: ease.move });
  tl.hold(36.8, 0.4);

  // — Beat 6 · the Exit —
  tl.caption({
    at: 37.4,
    dur: 6.6,
    text: 'The loop always ends the same way: with an exit. Success carrying the value, or failure carrying the full cause. Not a thrown surprise. A value you can inspect.',
  });
  tl.tween(cam, CAM_EXIT, { at: 37.6, dur: 1.4, ease: ease.move });
  tl.tween(exitU, 1, { at: 38.2, dur: 0.9, ease: ease.pop });
  tl.hold(43.6, 0.4);

  // — Beat 7 · doorway 1: runSync —
  tl.caption({
    at: 44.2,
    dur: 6.2,
    text: 'So how do you start the machine? Three doorways. Run sync turns the crank right here, on this thread, and hands you the answer immediately.',
  });
  tl.tween(dim1, 0.1, { at: 44.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_DOORS, { at: 44.4, dur: 1.4, ease: ease.move });
  tl.tween(doorsU, 1, { at: 45.2, dur: 1.4, ease: ease.enter });
  tl.hold(50.0, 0.4);

  // — Beat 8 · runSync's temper —
  tl.caption({
    at: 50.6,
    dur: 6.8,
    text: 'But run sync has a temper. If the description contains async work, the fiber cannot finish on this tick, so it throws, and names the fiber that could not be resolved synchronously.',
  });
  tl.tween(syncErrU, 1, { at: 51.6, dur: 0.7, ease: ease.pop });
  tl.hold(57.0, 0.4);

  // — Beat 9 · runPromise —
  tl.caption({
    at: 57.6,
    dur: 5.6,
    text: 'Run promise bridges to the world you already know: start a fiber, get back a promise of the result, and await it.',
  });
  tl.tween(promU, 1, { at: 58.4, dur: 2.2, ease: ease.linear });
  tl.hold(62.8, 0.4);

  // — Beat 10 · runFork —
  tl.caption({
    at: 63.4,
    dur: 7.4,
    text: 'And run fork gives you the fiber itself: a live process you can observe or interrupt. Here it repeats a log line every two hundred milliseconds, until we interrupt it half a second in.',
  });
  tl.tween(forkT, 1, { at: 64.2, dur: 4.2, ease: ease.linear });
  tl.hold(70.4, 0.4);

  // — Beat 11 · close —
  tl.caption({
    at: 71.2,
    dur: 6.6,
    text: 'One picture to keep. Descriptions are trees. Fibers are stack machines that walk them. And every walk ends in an exit.',
  });
  tl.tween(cam, CAM_WIDE, { at: 71.4, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 0.12, { at: 71.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 73.0, dur: 0.9, ease: ease.enter });
  tl.hold(77.4, 1.4);

  return { tl, cam, treeU, machU, walk, pops, exitU, dim1, doorsU, syncErrU, promU, forkT, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function TreeNode({ y, tag, line1, line2, u, hot }: {
  y: number;
  tag: string;
  line1: string;
  line2?: string;
  u: number;
  hot: number; // 0..1 highlight while the pointer sits here
}) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={TREE_X} y={y} width={NODE.w} height={NODE.h} rx={12} fill={colors.PANEL} stroke={hot > 0.5 ? colors.WARM : colors.ACCENT} strokeWidth={1.5 + 1.5 * hot} />
      <rect x={TREE_X + 14} y={y + 10} width={150} height={20} rx={10} fill={colors.BG} stroke={colors.GRID} />
      <text x={TREE_X + 89} y={y + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily="monospace">
        {tag}
      </text>
      <text x={TREE_X + 16} y={y + 50} fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
        {line1}
      </text>
      {line2 && (
        <text x={TREE_X + 16} y={y + 66} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
          {line2}
        </text>
      )}
    </g>
  );
}

function StackChip({ y, label, u }: { y: number; label: string; u: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={SLOT.x} y={y} width={SLOT.w} height={SLOT.h} rx={8} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.4} />
      <text x={SLOT.x + SLOT.w / 2} y={y + 27} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const treeU = s.get(scene.treeU);
  const machU = s.get(scene.machU);
  const walk = s.get(scene.walk);
  const pops = s.get(scene.pops);
  const exitU = s.get(scene.exitU);
  const dim1 = s.get(scene.dim1);
  const doorsU = s.get(scene.doorsU);
  const syncErrU = s.get(scene.syncErrU);
  const promU = s.get(scene.promU);
  const forkT = s.get(scene.forkT);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  // pointer position: descends with walk, climbs with pops
  const NODE_YS = [ROOT_Y, MID_Y, LEAF_Y];
  const downIdx = walk < 0.34 ? 0 : walk < 0.67 ? 1 : 2;
  const upIdx = pops < 0.45 ? 2 : pops < 0.9 ? 1 : 0;
  const ptrIdx = pops > 0.01 ? upIdx : downIdx;
  const ptrY = NODE_YS[ptrIdx] + NODE.h / 2;

  // pushes: chip 1 (root cont) lands when walk ≥ 0.34; chip 2 when walk ≥ 0.67
  const chip1U = clamp01((walk - 0.2) / 0.14) * (pops < 0.88 ? 1 : clamp01(1 - (pops - 0.88) / 0.1));
  const chip2U = clamp01((walk - 0.53) / 0.14) * (pops < 0.43 ? 1 : clamp01(1 - (pops - 0.43) / 0.1));

  // value bubble on the climb
  const bubbleY = pops <= 0.45 ? lerp(LEAF_Y + 38, MID_Y + 38, pops / 0.45) : pops <= 0.9 ? lerp(MID_Y + 38, ROOT_Y + 38, (pops - 0.45) / 0.45) : lerp(ROOT_Y + 38, EXIT_CARD.y + 66, (pops - 0.9) / 0.1);
  const bubbleX = pops <= 0.9 ? TREE_X + NODE.w + 34 : lerp(TREE_X + NODE.w + 34, EXIT_CARD.x - 20, (pops - 0.9) / 0.1);
  const bubbleVal = pops < 0.45 ? '100' : pops < 0.9 ? '200' : '190';

  const opCount = Math.round(walk * 3 + pops * 3);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= ACT 1 · the machine at work ================= */}
        <g opacity={dim1 * dimU}>
          {/* the description tree */}
          <g opacity={treeU}>
            <text x={TREE_X} y={ROOT_Y - 40} fill={colors.MUTED} fontSize={13}>
              the description, as the runtime sees it
            </text>
            <line x1={TREE_X + NODE.w / 2} y1={ROOT_Y + NODE.h} x2={TREE_X + NODE.w / 2} y2={MID_Y} stroke={colors.GRID} strokeWidth={2} />
            <line x1={TREE_X + NODE.w / 2} y1={MID_Y + NODE.h} x2={TREE_X + NODE.w / 2} y2={LEAF_Y} stroke={colors.GRID} strokeWidth={2} />
          </g>
          <TreeNode y={ROOT_Y} tag={'op: "OnSuccess"'} line1={'cont: (amount) =>'} line2={'  applyDiscount(amount, 5)'} u={clamp01(treeU * 3)} hot={ptrIdx === 0 && (walk > 0 || pops > 0.9) ? 1 : 0} />
          <TreeNode y={MID_Y} tag={'op: "OnSuccess"'} line1={'cont: (amount) =>'} line2={'  amount * 2'} u={clamp01(treeU * 3 - 1)} hot={ptrIdx === 1 ? 1 : 0} />
          <TreeNode y={LEAF_Y} tag={'_tag: "Success"'} line1={'value: 100'} u={clamp01(treeU * 3 - 2)} hot={ptrIdx === 2 ? 1 : 0} />

          {/* the current pointer */}
          {(walk > 0.01 || machU > 0.5) && pops < 0.98 && (
            <g opacity={machU}>
              <path d={`M ${TREE_X - 58} ${ptrY} l 34 0 l -10 -7 m 10 7 l -10 7`} stroke={colors.WARM} strokeWidth={2.5} fill="none" />
              <text x={TREE_X - 62} y={ptrY + 4} textAnchor="end" fill={colors.WARM} fontSize={12} fontFamily="monospace">
                current
              </text>
            </g>
          )}

          {/* the fiber machine */}
          {machU > 0.01 && (
            <g opacity={machU}>
              <rect x={MACH.x} y={MACH.y} width={MACH.w} height={MACH.h} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
              <text x={MACH.x + MACH.w / 2} y={MACH.y + 30} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>
                the fiber — a stack machine
              </text>
              <text x={MACH.x + MACH.w / 2} y={MACH.y + 56} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                {'while (true)'}
              </text>
              <text x={MACH.x + MACH.w / 2} y={MACH.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                {'  current = current[evaluate](fiber)'}
              </text>
              <text x={MACH.x + 24} y={MACH.y + 104} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                ops: {opCount}
              </text>
              {/* the stack well */}
              <rect x={SLOT.x - 8} y={MACH.y + 120} width={SLOT.w + 16} height={MACH.h - 150} rx={10} fill={colors.BG} stroke={colors.GRID} />
              <text x={SLOT.x + SLOT.w / 2} y={MACH.y + 142} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                _stack
              </text>
              <StackChip y={SLOT0_Y} label={'OnSuccess · applyDiscount'} u={chip1U} />
              <StackChip y={SLOT1_Y} label={'OnSuccess · double'} u={chip2U} />
            </g>
          )}

          {/* the climbing value bubble */}
          {pops > 0.01 && pops < 0.995 && (
            <g>
              <circle cx={bubbleX} cy={bubbleY} r={13} fill={colors.WARM} />
              <text x={bubbleX} y={bubbleY - 20} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="monospace" fontWeight={700}>
                {bubbleVal}
              </text>
            </g>
          )}

          {/* the Exit card */}
          {exitU > 0.01 && (
            <g opacity={exitU}>
              <rect x={EXIT_CARD.x} y={EXIT_CARD.y} width={EXIT_CARD.w} height={EXIT_CARD.h} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={EXIT_CARD.x + EXIT_CARD.w / 2} y={EXIT_CARD.y - 14} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                every run ends in an Exit
              </text>
              <text x={EXIT_CARD.x + 22} y={EXIT_CARD.y + 44} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                _tag: "Success"
              </text>
              <text x={EXIT_CARD.x + 22} y={EXIT_CARD.y + 70} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
                value: 190
              </text>
              <text x={EXIT_CARD.x + 22} y={EXIT_CARD.y + 102} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                or Failure — cause: ...
              </text>
            </g>
          )}
        </g>

        {/* ================= ACT 2 · the three doorways ================= */}
        {doorsU > 0.01 && (
          <g opacity={doorsU * dimU}>
            {/* — runSync — */}
            <g>
              <rect x={DOOR_X[0]} y={DOOR.y} width={DOOR.w} height={DOOR.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={DOOR_X[0] + 20} y={DOOR.y + 34} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                Effect.runSync(program)
              </text>
              <text x={DOOR_X[0] + 20} y={DOOR.y + 60} fill={colors.MUTED} fontSize={12}>
                now, on this thread
              </text>
              <rect x={DOOR_X[0] + 20} y={DOOR.y + 80} width={90} height={34} rx={8} fill={colors.BG} stroke={colors.POSITIVE} />
              <text x={DOOR_X[0] + 65} y={DOOR.y + 102} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily="monospace">
                190
              </text>
              {syncErrU > 0.01 && (
                <g opacity={syncErrU}>
                  <rect x={DOOR_X[0] + 20} y={DOOR.y + 134} width={DOOR.w - 40} height={94} rx={8} fill="#180a10" stroke={colors.NEGATIVE} />
                  <text x={DOOR_X[0] + 32} y={DOOR.y + 158} fill={colors.NEGATIVE} fontSize={10.5} fontFamily="monospace">
                    (FiberFailure) AsyncFiberException:
                  </text>
                  <text x={DOOR_X[0] + 32} y={DOOR.y + 176} fill={colors.NEGATIVE} fontSize={10.5} fontFamily="monospace">
                    Fiber #0 cannot be resolved
                  </text>
                  <text x={DOOR_X[0] + 32} y={DOOR.y + 194} fill={colors.NEGATIVE} fontSize={10.5} fontFamily="monospace">
                    synchronously — async work inside
                  </text>
                </g>
              )}
            </g>

            {/* — runPromise — */}
            <g>
              <rect x={DOOR_X[1]} y={DOOR.y} width={DOOR.w} height={DOOR.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={DOOR_X[1] + 20} y={DOOR.y + 34} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                Effect.runPromise(program)
              </text>
              <text x={DOOR_X[1] + 20} y={DOOR.y + 60} fill={colors.MUTED} fontSize={12}>
                a bridge to async and await
              </text>
              {/* mini track: fiber → promise → .then */}
              <line x1={DOOR_X[1] + 30} y1={DOOR.y + 130} x2={DOOR_X[1] + DOOR.w - 30} y2={DOOR.y + 130} stroke={colors.GRID} strokeWidth={6} strokeLinecap="round" />
              {promU > 0.01 && promU < 0.99 && (
                <circle cx={DOOR_X[1] + 30 + (DOOR.w - 60) * promU} cy={DOOR.y + 130} r={8} fill={colors.ACCENT} />
              )}
              <text x={DOOR_X[1] + 20} y={DOOR.y + 170} fill={colors.TEXT} fontSize={11.5} fontFamily="monospace" opacity={clamp01(promU * 4 - 3)}>
                .then(console.log)  {'// 190'}
              </text>
            </g>

            {/* — runFork — */}
            <g>
              <rect x={DOOR_X[2]} y={DOOR.y} width={DOOR.w} height={DOOR.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={DOOR_X[2] + 20} y={DOOR.y + 34} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                Effect.runFork(program)
              </text>
              <text x={DOOR_X[2] + 20} y={DOOR.y + 60} fill={colors.MUTED} fontSize={12}>
                a live fiber you can interrupt
              </text>
              {/* fork timeline: 0..700 ms */}
              <line x1={DOOR_X[2] + 30} y1={DOOR.y + 140} x2={DOOR_X[2] + DOOR.w - 30} y2={DOOR.y + 140} stroke={colors.GRID} strokeWidth={2} />
              {[0, 200, 400].map((ms) => {
                const on = forkT * 700 >= ms;
                const x = DOOR_X[2] + 30 + ((DOOR.w - 60) * ms) / 700;
                return (
                  <g key={ms} opacity={on ? 1 : 0.15}>
                    <circle cx={x} cy={DOOR.y + 140} r={7} fill={on ? colors.POSITIVE : colors.GRID} />
                    <text x={x} y={DOOR.y + 122} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
                      {ms} ms
                    </text>
                  </g>
                );
              })}
              {/* the interruption at 500 ms */}
              {forkT * 700 >= 500 && (
                <g>
                  {(() => {
                    const x = DOOR_X[2] + 30 + ((DOOR.w - 60) * 500) / 700;
                    return (
                      <g>
                        <line x1={x - 9} y1={DOOR.y + 128} x2={x + 9} y2={DOOR.y + 152} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                        <line x1={x + 9} y1={DOOR.y + 128} x2={x - 9} y2={DOOR.y + 152} stroke={colors.NEGATIVE} strokeWidth={2.5} />
                      </g>
                    );
                  })()}
                  <text x={DOOR_X[2] + 20} y={DOOR.y + 190} fill={colors.NEGATIVE} fontSize={11.5} fontFamily="monospace">
                    Effect.runFork(Fiber.interrupt(fiber))
                  </text>
                  <text x={DOOR_X[2] + 20} y={DOOR.y + 212} fill={colors.MUTED} fontSize={11}>
                    interrupted — cleanly, at 500 ms
                  </text>
                </g>
              )}
              {forkT > 0.01 && forkT * 700 < 500 && (
                <text x={DOOR_X[2] + 20} y={DOOR.y + 190} fill={colors.POSITIVE} fontSize={11.5} fontFamily="monospace">
                  running...
                </text>
              )}
            </g>
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={310} y={240} width={660} height={170} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
              descriptions are trees · fibers walk them
            </text>
            <text x={640} y={344} textAnchor="middle" fill={colors.POSITIVE} fontSize={20} fontWeight={700}>
              every walk ends in an Exit
            </text>
            <text x={640} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace">
              runSync · runPromise · runFork
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
