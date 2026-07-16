// The Runloop
//
// Grounding: packages/effect/src/internal/effect.ts — FiberImpl.runLoop (the
// while(true) over current[evaluate](fiber)), getCont (pop _stack until a
// frame carries the wanted continuation), OnSuccessProto (flatMap pushes
// itself, returns its inner effect), sync (runs the thunk, asks getCont(contA)),
// OnFailureProto (catchCause carries only a failureCont);
// packages/effect/src/internal/core.ts — exitSucceed (pops contA),
// exitFailCause (pops contE, discarding frames without one).
//
// Centerpiece: the fiber machine — a CURRENT slot with an orbiting loop dot,
// and the _stack as a physical column of frames with success/failure ports.
// The same program runs twice: a sunny pass where values pop success frames,
// and a failing pass where the cause slides PAST both success frames (no
// failure port — discarded, never run) into the catch frame.
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
// Layout — code, the machine (current slot + stack), the exit tray.
// ---------------------------------------------------------------------------

const CODE = { x: 48, y: 104, w: 320, h: 196 } as const;
const CODE_LINES = [
  'const program = load.pipe(',
  '  Effect.flatMap((n) =>',
  '    Effect.sync(() => n * 21)),',
  '  Effect.flatMap((n) =>',
  '    Effect.sync(() => "ans: " + n)),',
  '  Effect.catchCause(recover))',
] as const;

const PANEL = { x: 420, y: 84, w: 460, h: 480 } as const;
const SLOT = { x: 452, y: 176, w: 220, h: 76 } as const;
const SLOT_C = { x: SLOT.x + SLOT.w / 2, y: SLOT.y + SLOT.h / 2 } as const;
const STACK_X = 712;
const STACK_W = 144;
const STACK_H = 48;
const stackY = (i: number): number => 500 - i * 56; // i=0 bottom
const OPS = { x: PANEL.x + 32, y: PANEL.y + 442 } as const;
const TRAY = { x: 930, y: 150, w: 280 } as const;

const CAM_WIDE: CameraState = { x: 640, y: 355, k: 1.02 };
const CAM_MACHINE: CameraState = { x: 660, y: 330, k: 1.22 };
const CAM_STACK: CameraState = { x: 760, y: 360, k: 1.32 };

// current-slot contents, stepped through with tl.set on curIdx
const CUR: Array<{ label: string; sub: string; color: string }> = [
  { label: '', sub: '', color: colors.MUTED }, // 0 empty
  { label: 'OnFailure', sub: 'catchCause(recover)', color: colors.ACCENT }, // 1
  { label: 'OnSuccess', sub: 'flatMap(fmt)', color: colors.ACCENT }, // 2
  { label: 'OnSuccess', sub: 'flatMap(n => n * 21)', color: colors.ACCENT }, // 3
  { label: 'Success', sub: 'value: 2', color: colors.POSITIVE }, // 4
  { label: 'Sync', sub: 'thunk: () => 2 * 21', color: colors.WARM }, // 5
  { label: 'Success', sub: 'value: 42', color: colors.POSITIVE }, // 6
  { label: 'Sync', sub: 'thunk: () => "ans: 42"', color: colors.WARM }, // 7
  { label: 'Success', sub: 'value: "ans: 42"', color: colors.POSITIVE }, // 8
  { label: 'Failure', sub: 'cause: load offline', color: colors.NEGATIVE }, // 9
  { label: 'Sync', sub: 'recover: () => "cached"', color: colors.WARM }, // 10
  { label: 'Success', sub: 'value: "cached"', color: colors.POSITIVE }, // 11
];

// stack frames, bottom (0) → top (2); push order: catch, fmt, ×21
const FRAMES = [
  { name: 'OnFailure', tag: 'recover', portA: false, portE: true },
  { name: 'OnSuccess', tag: 'fmt', portA: true, portE: false },
  { name: 'OnSuccess', tag: 'n * 21', portA: true, portE: false },
] as const;

// ---------------------------------------------------------------------------
// Timeline (~88s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const codeU = tl.channel('codeU', 0);
  const panelU = tl.channel('panelU', 0);
  const spinU = tl.channel('spinU', 0); // the loop dot, always orbiting
  const curIdx = tl.channel('curIdx', 0); // index into CUR
  const pushU = tl.channel('pushU', 0); // run A: 3 frames push
  const ping1 = tl.channel('ping1', 0); // "who wants a success?" → top frame
  const pop1 = tl.channel('pop1', 0); // ×21 frame pops into the slot
  const ping2 = tl.channel('ping2', 0);
  const pop2 = tl.channel('pop2', 0); // fmt frame pops
  const pop3 = tl.channel('pop3', 0); // catch frame discarded on success
  const exit1U = tl.channel('exit1U', 0);
  const obs1U = tl.channel('obs1U', 0);
  const trampU = tl.channel('trampU', 0); // "_stack: Array<Primitive>" chip
  const rewindU = tl.channel('rewindU', 0); // reset for run B
  const pushB = tl.channel('pushB', 0); // run B: frames re-push
  const pingF = tl.channel('pingF', 0); // failure asks the stack
  const skipU = tl.channel('skipU', 0); // 0..2 — both success frames fly off
  const catchPop = tl.channel('catchPop', 0); // catch frame answers
  const exit2U = tl.channel('exit2U', 0);
  const obs2U = tl.channel('obs2U', 0);
  const opsN = tl.channel('opsN', 0); // evaluate counter
  const dimU = tl.channel('dimU', 0);

  // — beat 1 · the loop —
  tl.caption({
    at: 0.5,
    dur: 7.2,
    text: "Inside every fiber there's a single loop. Take the current instruction, call its evaluate, and whatever comes back becomes the next instruction. That's the whole engine.",
  });
  tl.tween(codeU, 1, { at: 0.6, dur: 1.6, ease: ease.linear });
  tl.tween(panelU, 1, { at: 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_MACHINE, { at: 1.6, dur: 1.5, ease: ease.move });
  tl.set(curIdx, 1, 3.2);
  tl.tween(spinU, 15, { at: 2.0, dur: 86, ease: ease.linear });
  tl.tween(opsN, 3, { at: 3.2, dur: 8, ease: ease.linear });
  tl.hold(7.7, 0.5);

  // — beat 2 · wrappers push frames —
  tl.caption({
    at: 8.2,
    dur: 7.4,
    text: 'Wrappers go first. A flat map evaluates by pushing itself onto the stack as a promise for later, and handing the loop its inner effect. Three wrappers, three frames.',
  });
  tl.tween(pushU, 3, { at: 8.8, dur: 4.6, ease: ease.linear });
  tl.set(curIdx, 2, 10.2);
  tl.set(curIdx, 3, 11.7);
  tl.set(curIdx, 4, 13.2);
  tl.hold(15.6, 0.6);

  // — beat 3 · the leaf asks —
  tl.caption({
    at: 16.2,
    dur: 6.4,
    text: "Eventually the loop hits a leaf. Here it's a success carrying the number two, and it asks the stack exactly one question: who is waiting for a success?",
  });
  tl.tween(cam, CAM_STACK, { at: 16.4, dur: 1.3, ease: ease.move });
  tl.tween(ping1, 1, { at: 18.4, dur: 1.2, ease: ease.move });
  tl.tween(opsN, 5, { at: 16.4, dur: 6, ease: ease.linear });
  tl.hold(22.6, 0.6);

  // — beat 4 · the top frame answers —
  tl.caption({
    at: 23.2,
    dur: 6.8,
    text: 'The top frame answers. It pops, feeds two into your function, and the result — a brand new instruction — takes over the current slot.',
  });
  tl.tween(pop1, 1, { at: 24.0, dur: 1.2, ease: ease.move });
  tl.set(curIdx, 5, 25.2);
  tl.hold(30.0, 0.6);

  // — beat 5 · the rhythm —
  tl.caption({
    at: 30.6,
    dur: 7.0,
    text: 'Sync runs your thunk right here: two times twenty one is forty two. Pop the next frame, feed it forty two, continue. The rhythm never changes.',
  });
  tl.set(curIdx, 6, 31.8);
  tl.tween(ping2, 1, { at: 33.0, dur: 1.0, ease: ease.move });
  tl.tween(pop2, 1, { at: 34.2, dur: 1.1, ease: ease.move });
  tl.set(curIdx, 7, 35.3);
  tl.set(curIdx, 8, 36.6);
  tl.tween(opsN, 9, { at: 30.8, dur: 6, ease: ease.linear });
  tl.hold(37.6, 0.6);

  // — beat 6 · trampoline —
  tl.caption({
    at: 38.2,
    dur: 7.2,
    text: "Notice what never happened: the native call stack never grew. The fiber's stack is a plain array on the heap, so a million chained steps can't overflow anything.",
  });
  tl.tween(trampU, 1, { at: 38.6, dur: 0.7, ease: ease.pop });
  tl.tween(pop3, 1, { at: 40.0, dur: 1.0, ease: ease.move }); // catch, quietly discarded
  tl.tween(cam, CAM_WIDE, { at: 41.0, dur: 1.4, ease: ease.move });
  tl.tween(exit1U, 1, { at: 42.4, dur: 0.8, ease: ease.enter });
  tl.tween(obs1U, 1, { at: 43.4, dur: 0.8, ease: ease.pop });
  tl.tween(opsN, 10, { at: 39, dur: 3, ease: ease.linear });
  tl.hold(45.4, 0.7);

  // — beat 7 · run it again, badly —
  tl.caption({
    at: 46.1,
    dur: 6.2,
    text: 'Now run the same program on a bad day. The load fails, and the current instruction becomes a failure carrying a cause.',
  });
  tl.tween(rewindU, 1, { at: 46.3, dur: 1.0, ease: ease.move });
  tl.tween(trampU, 0, { at: 46.3, dur: 0.6, ease: ease.enter });
  tl.tween(pushB, 3, { at: 47.6, dur: 2.4, ease: ease.linear });
  tl.set(curIdx, 9, 50.4);
  tl.tween(cam, CAM_STACK, { at: 48.4, dur: 1.4, ease: ease.move });
  tl.tween(opsN, 14, { at: 47, dur: 5, ease: ease.linear });
  tl.hold(52.3, 0.5);

  // — beat 8 · the failure's question —
  tl.caption({
    at: 52.8,
    dur: 7.4,
    text: 'A failure walks the same stack with a different question: who handles failure? These two frames only handle success — so they are discarded. Popped, never run.',
  });
  tl.tween(pingF, 1, { at: 53.6, dur: 1.2, ease: ease.move });
  tl.tween(skipU, 1, { at: 55.2, dur: 1.2, ease: ease.move });
  tl.tween(skipU, 2, { at: 57.2, dur: 1.2, ease: ease.move });
  tl.hold(60.2, 0.6);

  // — beat 9 · that IS the error channel —
  tl.caption({
    at: 60.8,
    dur: 6.4,
    text: 'That skipping is the error channel. Nothing is thrown and nothing unwinds — short circuiting your errors is just stack discipline.',
  });
  tl.hold(67.2, 0.7);

  // — beat 10 · the catch answers —
  tl.caption({
    at: 67.9,
    dur: 6.6,
    text: 'The catch frame does carry a failure continuation. The cause lands there, and recovery is nothing special — just more instructions in the current slot.',
  });
  tl.tween(catchPop, 1, { at: 68.7, dur: 1.2, ease: ease.move });
  tl.set(curIdx, 10, 70.0);
  tl.set(curIdx, 11, 71.6);
  tl.tween(opsN, 17, { at: 68.7, dur: 4, ease: ease.linear });
  tl.hold(74.5, 0.5);

  // — beat 11 · exit + observers —
  tl.caption({
    at: 75.0,
    dur: 7.4,
    text: 'When the stack runs dry, the loop stops. The fiber stores its exit and hands it to every observer that was waiting. That is a program, fully run.',
  });
  tl.tween(cam, CAM_WIDE, { at: 75.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 76.0, dur: 1.2, ease: ease.move });
  tl.tween(exit2U, 1, { at: 76.8, dur: 0.9, ease: ease.enter });
  tl.tween(obs2U, 1, { at: 78.2, dur: 0.9, ease: ease.pop });
  tl.hold(82.4, 1.8);

  return {
    tl,
    cam,
    codeU,
    panelU,
    spinU,
    curIdx,
    pushU,
    ping1,
    pop1,
    ping2,
    pop2,
    pop3,
    exit1U,
    obs1U,
    trampU,
    rewindU,
    pushB,
    pingF,
    skipU,
    catchPop,
    exit2U,
    obs2U,
    opsN,
    dimU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Frame({
  i,
  present,
  popT,
  skipT,
  ask,
}: {
  i: number;
  present: number;
  popT: number; // slides left into the slot (consumed)
  skipT: number; // slides right, discarded
  ask: number; // highlight while the question dot sits on it
}) {
  const f = FRAMES[i];
  const vis = present * (1 - Math.max(popT, skipT));
  if (vis <= 0.01) return null;
  const dx = -popT * 200 + skipT * 240;
  const y = stackY(i);
  return (
    <g opacity={vis} transform={`translate(${dx} ${(1 - present) * 16})`}>
      <rect x={STACK_X} y={y} width={STACK_W} height={STACK_H} rx={9} fill={colors.PANEL} stroke={ask > 0.5 ? colors.WARM : colors.GRID} strokeWidth={ask > 0.5 ? 2 : 1.2} />
      <text x={STACK_X + 12} y={y + 20} fill={colors.TEXT} fontSize={12} fontFamily={MONO} fontWeight={600}>
        {f.name}
      </text>
      <text x={STACK_X + 12} y={y + 37} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
        {f.tag}
      </text>
      {/* continuation ports: green = success, red = failure */}
      {f.portA && <circle cx={STACK_X + STACK_W - 14} cy={y + 15} r={5.5} fill={colors.POSITIVE} />}
      {f.portE && <circle cx={STACK_X + STACK_W - 14} cy={y + 33} r={5.5} fill={colors.NEGATIVE} />}
      {skipT > 0.15 && (
        <text x={STACK_X + STACK_W + 14} y={y + 30} fill={colors.NEGATIVE} fontSize={17} fontWeight={700}>
          ✕
        </text>
      )}
    </g>
  );
}

/** A question dot traveling from the current slot to a stack frame. */
function Ping({ u, target, color }: { u: number; target: number; color: string }) {
  if (u <= 0 || u >= 1) return null;
  const x = SLOT_C.x + 110 + (STACK_X - SLOT_C.x - 110) * u;
  const y = SLOT_C.y + (stackY(target) + STACK_H / 2 - SLOT_C.y) * u;
  return <circle cx={x} cy={y} r={7} fill="none" stroke={color} strokeWidth={2.5} />;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const codeU = s.get(scene.codeU);
  const panelU = s.get(scene.panelU);
  const spinU = s.get(scene.spinU);
  const curIdx = Math.round(s.get(scene.curIdx));
  const pushU = s.get(scene.pushU);
  const ping1 = s.get(scene.ping1);
  const pop1 = s.get(scene.pop1);
  const ping2 = s.get(scene.ping2);
  const pop2 = s.get(scene.pop2);
  const pop3 = s.get(scene.pop3);
  const exit1U = s.get(scene.exit1U);
  const obs1U = s.get(scene.obs1U);
  const trampU = s.get(scene.trampU);
  const rewindU = s.get(scene.rewindU);
  const pushB = s.get(scene.pushB);
  const pingF = s.get(scene.pingF);
  const skipU = s.get(scene.skipU);
  const catchPop = s.get(scene.catchPop);
  const exit2U = s.get(scene.exit2U);
  const obs2U = s.get(scene.obs2U);
  const opsN = Math.round(s.get(scene.opsN));
  const dimU = s.get(scene.dimU);

  const cur = CUR[Math.min(curIdx, CUR.length - 1)];
  const runB = rewindU > 0.5;
  const machineOp = 1 - 0.85 * dimU;

  // per-frame state (i: 0=catch bottom, 1=fmt, 2=×21 top)
  const frameState = (i: number) => {
    if (!runB) {
      const present = win(pushU, 3, i, 1);
      const popT = i === 2 ? pop1 : i === 1 ? pop2 : pop3;
      return { present, popT, skipT: 0, ask: i === 2 ? (ping1 >= 1 ? 1 : 0) : i === 1 ? (ping2 >= 1 ? 1 : 0) : 0 };
    }
    const present = win(pushB, 3, i, 1);
    const skipT = i === 2 ? clamp01(skipU) : i === 1 ? clamp01(skipU - 1) : 0;
    const popT = i === 0 ? catchPop : 0;
    return { present, popT, skipT, ask: i === 2 && pingF >= 1 && skipU < 0.2 ? 1 : 0 };
  };

  // orbiting loop dot around the current slot
  const ang = spinU * Math.PI * 2;
  const dotX = SLOT_C.x + 138 * Math.cos(ang);
  const dotY = SLOT_C.y + 58 * Math.sin(ang);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the program */}
        <g opacity={(1 - 0.86 * dimU) * codeU}>
          <rect x={CODE.x} y={CODE.y} width={CODE.w} height={CODE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          {CODE_LINES.map((line, i) => (
            <text key={i} x={CODE.x + 18} y={CODE.y + 34 + i * 24} fill={colors.TEXT} fontSize={12} fontFamily={MONO} opacity={win(codeU, CODE_LINES.length, i, 1.8)}>
              {line}
            </text>
          ))}
          {/* run B weather note */}
          {runB && (
            <text x={CODE.x + 18} y={CODE.y + CODE.h + 24} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
              load → Failure("offline")
            </text>
          )}
        </g>

        {/* the machine */}
        <g opacity={panelU * machineOp}>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={PANEL.x + 24} y={PANEL.y + 32} fill={colors.TEXT} fontSize={15.5} fontWeight={700}>
            FiberImpl · runLoop
          </text>
          <text x={PANEL.x + PANEL.w - 20} y={PANEL.y + 32} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            while (true)
          </text>

          {/* current slot */}
          <ellipse cx={SLOT_C.x} cy={SLOT_C.y} rx={138} ry={58} fill="none" stroke={colors.GRID} strokeDasharray="3 6" />
          <circle cx={dotX} cy={dotY} r={5} fill={colors.SECONDARY} />
          <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={10} fill={colors.BG} stroke={cur.label ? cur.color : colors.MUTED} strokeWidth={1.8} />
          <text x={SLOT.x + SLOT.w / 2} y={SLOT.y - 10} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            current
          </text>
          {cur.label ? (
            <>
              <text x={SLOT.x + 16} y={SLOT.y + 30} fill={cur.color} fontSize={14.5} fontFamily={MONO} fontWeight={700}>
                {cur.label}
              </text>
              <text x={SLOT.x + 16} y={SLOT.y + 54} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                {cur.sub}
              </text>
            </>
          ) : (
            <text x={SLOT.x + SLOT.w / 2} y={SLOT.y + SLOT.h / 2 + 4} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={0.6}>
              empty
            </text>
          )}
          {/* evaluate arrow into the slot */}
          <text x={SLOT.x + SLOT.w / 2} y={SLOT.y + SLOT.h + 26} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            current[evaluate](fiber)
          </text>

          {/* the stack */}
          <text x={STACK_X + STACK_W / 2} y={stackY(2) - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            _stack
          </text>
          {[0, 1, 2].map((i) => {
            const st = frameState(i);
            return <Frame key={i} i={i} present={st.present} popT={st.popT} skipT={st.skipT} ask={st.ask} />;
          })}

          {/* the asks */}
          <Ping u={ping1} target={2} color={colors.POSITIVE} />
          <Ping u={ping2} target={1} color={colors.POSITIVE} />
          <Ping u={pingF} target={2} color={colors.NEGATIVE} />

          {/* ops counter */}
          <text x={OPS.x} y={OPS.y} fill={colors.MUTED} fontSize={12.5}>
            instructions evaluated
          </text>
          <text x={OPS.x + 178} y={OPS.y + 1} fill={colors.TEXT} fontSize={17} fontFamily={MONO} fontWeight={700}>
            {opsN}
          </text>

          {/* the trampoline chip */}
          <g opacity={trampU}>
            <rect x={PANEL.x + 24} y={PANEL.y + 384} width={266} height={32} rx={8} fill={colors.BG} stroke={colors.WARM} />
            <text x={PANEL.x + 40} y={PANEL.y + 405} fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
              _stack: Array&lt;Primitive&gt;
            </text>
          </g>
        </g>

        {/* the exit tray */}
        <g opacity={exit1U * (runB ? 0.3 : 1) * machineOp}>
          <rect x={TRAY.x} y={TRAY.y} width={TRAY.w} height={64} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text x={TRAY.x + 18} y={TRAY.y + 27} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} fontWeight={700}>
            Exit · Success
          </text>
          <text x={TRAY.x + 18} y={TRAY.y + 48} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
            "ans: 42"
          </text>
        </g>
        <g opacity={exit2U}>
          <rect x={TRAY.x} y={TRAY.y + 84} width={TRAY.w} height={64} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
          <text x={TRAY.x + 18} y={TRAY.y + 111} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} fontWeight={700}>
            Exit · Success
          </text>
          <text x={TRAY.x + 18} y={TRAY.y + 132} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
            "cached" — recovered
          </text>
        </g>
        {/* observers */}
        {[0, 1].map((run) => {
          const u = run === 0 ? obs1U * (runB ? 0.3 : 1) : obs2U;
          if (u <= 0) return null;
          const y = TRAY.y + (run === 0 ? 0 : 84) + 32;
          return (
            <g key={run} opacity={u}>
              {[0, 1].map((j) => (
                <g key={j}>
                  <line x1={TRAY.x + TRAY.w} y1={y} x2={TRAY.x + TRAY.w + 34} y2={y - 18 + j * 36} stroke={colors.GRID} strokeWidth={1.2} />
                  <circle cx={TRAY.x + TRAY.w + 42} cy={y - 18 + j * 36} r={7} fill="none" stroke={colors.WARM} strokeWidth={1.8} />
                </g>
              ))}
              <text x={TRAY.x + TRAY.w + 12} y={y + 52} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                _observers
              </text>
            </g>
          );
        })}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
