// The Double Pass
//
// Backing files: __tests__/application/compose.test.js — two middleware push
// 1 / await / 4 and 2 / await / 3; the run asserts calls deep-equals
// [1, 2, 3, 4]. koa-compose/index.js — dispatch(i) and the resolved promise
// at i === middleware.length. Readme.md — the logger middleware
// (start = Date.now(); await next(); ms = Date.now() - start) and the phrase
// "actions downstream, then filter and manipulate the response upstream".
//
// Centerpiece: the onion cut open — two nested U-brackets. The request dot
// descends the left legs, turns on the empty floor, climbs the right legs.
// Awaiting halves park with pause badges and wake in reverse order while a
// ticker tape collects 1, 2, 3, 4.
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
import { Brace, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — two nested brackets and the request's waypoint path through them.
// ---------------------------------------------------------------------------

const OUT = { l: 400, r: 1000, top: 150, bot: 545 } as const; // middleware one
const INN = { l: 545, r: 855, top: 228, bot: 462 } as const; // middleware two

// the request's full journey, as waypoints (piecewise linear in jU)
const WAY: ReadonlyArray<readonly [number, number]> = [
  [OUT.l, 95], // 0 — above the onion
  [OUT.l, 245], // 1 — push 1
  [INN.l, 320], // 2 — through the doorway (await next)
  [INN.l, 385], // 3 — push 2
  [INN.l, INN.bot], // 4 — inner corner
  [700, INN.bot], // 5 — the floor: turnaround
  [INN.r, INN.bot], // 6 — inner corner
  [INN.r, 385], // 7 — push 3 (middleware two resumes)
  [OUT.r, 320], // 8 — back through the doorway
  [OUT.r, 245], // 9 — push 4 (middleware one resumes)
  [OUT.r, 95], // 10 — out
];

const dotAt = (jU: number): { x: number; y: number } => {
  const k = Math.min(Math.max(jU, 0), WAY.length - 1.0001);
  const i = Math.floor(k);
  const u = k - i;
  return { x: lerp(WAY[i][0], WAY[i + 1][0], u), y: lerp(WAY[i][1], WAY[i + 1][1], u) };
};

const bracketPath = (b: { l: number; r: number; top: number; bot: number }): string =>
  `M ${b.l} ${b.top} V ${b.bot} H ${b.r} V ${b.top}`;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_LEFT: CameraState = { x: 470, y: 300, k: 1.35 };
const CAM_FLOOR: CameraState = { x: 700, y: 430, k: 1.5 };
const CAM_RIGHT: CameraState = { x: 900, y: 300, k: 1.35 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bracketsU: ChannelRef<number>; // 0..2 — bracket i draws at u > i
  codeU: ChannelRef<number>;
  jU: ChannelRef<number>; // journey along WAY
  p1U: ChannelRef<number>; // middleware one paused
  p2U: ChannelRef<number>; // middleware two paused
  tapeN: ChannelRef<number>; // how many numbers are on the tape
  floorU: ChannelRef<number>;
  checkU: ChannelRef<number>; // the deep-equal green light
  timerU: ChannelRef<number>; // the logger clock replay
  braceU: ChannelRef<number>;
  flowU: ChannelRef<number>; // downstream / upstream arrows
  stageDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bracketsU = tl.channel('bracketsU', 0);
  const codeU = tl.channel('codeU', 0);
  const jU = tl.channel('jU', 0);
  const p1U = tl.channel('p1U', 0);
  const p2U = tl.channel('p2U', 0);
  const tapeN = tl.channel('tapeN', 0);
  const floorU = tl.channel('floorU', 0);
  const checkU = tl.channel('checkU', 0);
  const timerU = tl.channel('timerU', 0);
  const braceU = tl.channel('braceU', 0);
  const flowU = tl.channel('flowU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the riddle —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Here is a question with a surprising answer. If two middleware each log a number before and after awaiting next, what order do the four numbers appear in?',
  });
  tl.tween(bracketsU, 2, { at: 0.6, dur: 2.6, ease: ease.draw });
  tl.hold(6.9, 0.5);

  // — Beat 2 · the program is from Koa's own tests —
  tl.caption({
    at: 7.4,
    dur: 6,
    text: "This exact program lives in Koa's own test suite. Middleware one pushes one, awaits, then pushes four. Middleware two pushes two, awaits, then pushes three.",
  });
  tl.tween(codeU, 1, { at: 7.8, dur: 1.2, ease: ease.enter });
  tl.hold(13.4, 0.5);

  // — Beat 3 · enter, push 1 —
  tl.caption({
    at: 13.9,
    dur: 5.6,
    text: 'The request enters the outer bracket. Push one goes on the tape. Then middleware one hits await next — and something subtle happens.',
  });
  tl.tween(cam, CAM_LEFT, { at: 14.1, dur: 1.6, ease: ease.move });
  tl.tween(jU, 1, { at: 14.5, dur: 1.6, ease: ease.move });
  tl.tween(tapeN, 1, { at: 16.2, dur: 0.4, ease: ease.pop });
  tl.hold(19.5, 0.5);

  // — Beat 4 · the await parks a half —
  tl.caption({
    at: 20.0,
    dur: 6.4,
    text: "Await doesn't just call the next function. It pauses this one mid sentence, and parks the rest of it — everything after the await — as a pending promise.",
  });
  tl.tween(p1U, 1, { at: 20.8, dur: 0.8, ease: ease.enter });
  tl.tween(jU, 2, { at: 22.4, dur: 1.4, ease: ease.move });
  tl.hold(26.4, 0.5);

  // — Beat 5 · one level down, push 2, park again —
  tl.caption({
    at: 26.9,
    dur: 6.2,
    text: 'Control drops a level. Middleware two runs its first half: push two goes on the tape. Then it too awaits, and parks its own second half.',
  });
  tl.tween(jU, 3, { at: 27.3, dur: 1.2, ease: ease.move });
  tl.tween(tapeN, 2, { at: 28.6, dur: 0.4, ease: ease.pop });
  tl.tween(p2U, 1, { at: 30.4, dur: 0.8, ease: ease.enter });
  tl.hold(32.6, 0.5);

  // — Beat 6 · the floor —
  tl.caption({
    at: 33.1,
    dur: 6,
    text: 'Now dispatch reaches index two. The array is exhausted, so it returns an already resolved promise. The floor of the onion. The turnaround.',
  });
  tl.tween(cam, CAM_FLOOR, { at: 33.3, dur: 1.6, ease: ease.move });
  tl.tween(jU, 5, { at: 33.9, dur: 1.8, ease: ease.move });
  tl.tween(floorU, 1, { at: 36.0, dur: 0.7, ease: ease.pop });
  tl.tween(floorU, 0.3, { at: 38.2, dur: 0.8, ease: ease.move });
  tl.hold(38.6, 0.4);

  // — Beat 7 · middleware two wakes: push 3 —
  tl.caption({
    at: 39.0,
    dur: 5.4,
    text: 'The resolution climbs back up. Middleware two wakes exactly where it paused, and runs its second half: push three.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 39.2, dur: 1.6, ease: ease.move });
  tl.tween(jU, 7, { at: 39.6, dur: 1.8, ease: ease.move });
  tl.tween(p2U, 0, { at: 40.8, dur: 0.7, ease: ease.move });
  tl.tween(tapeN, 3, { at: 41.6, dur: 0.4, ease: ease.pop });
  tl.hold(43.9, 0.5);

  // — Beat 8 · middleware one wakes: push 4 — the tape reads 1 2 3 4 —
  tl.caption({
    at: 44.4,
    dur: 6.6,
    text: 'Then middleware one wakes and finishes: push four. The tape reads one, two, three, four — first in, last out, like nested function calls unwinding.',
  });
  tl.tween(jU, 9, { at: 44.8, dur: 1.6, ease: ease.move });
  tl.tween(p1U, 0, { at: 45.8, dur: 0.7, ease: ease.move });
  tl.tween(tapeN, 4, { at: 46.6, dur: 0.4, ease: ease.pop });
  tl.tween(checkU, 1, { at: 48.4, dur: 0.6, ease: ease.pop });
  tl.tween(jU, 10, { at: 49.6, dur: 1.2, ease: ease.move });
  tl.hold(51.4, 0.5);

  // — Beat 9 · why it matters: the readme logger —
  tl.caption({
    at: 51.9,
    dur: 6,
    text: "This double pass is why Koa middleware is more than a pipeline. The readme's own logger starts a clock, awaits next, then measures the difference.",
  });
  tl.tween(cam, CAM_WIDE, { at: 52.1, dur: 1.8, ease: ease.move });
  tl.tween(timerU, 1, { at: 53.4, dur: 3.0, ease: ease.linear });
  tl.hold(58.3, 0.4);

  // — Beat 10 · everything below gets timed —
  tl.caption({
    at: 58.7,
    dur: 5.8,
    text: 'Everything nested inside that await gets timed: every deeper middleware, the handler, all of it. The logger wraps the whole onion below itself.',
  });
  tl.tween(braceU, 1, { at: 59.3, dur: 1.2, ease: ease.draw });
  tl.hold(64.0, 0.5);

  // — Beat 11 · downstream / upstream —
  tl.caption({
    at: 64.5,
    dur: 5.6,
    text: "Downstream for actions, upstream to filter and manipulate the response — that's the phrase Koa's own readme uses. First half on the way in, second half on the way out.",
  });
  tl.tween(flowU, 1, { at: 65.1, dur: 1.8, ease: ease.draw });
  tl.hold(69.6, 0.5);

  // — Beat 12 · the last word —
  tl.caption({
    at: 70.1,
    dur: 6.4,
    text: "And because the halves unwind in reverse, whatever runs first gets the last word. Remember that — it's exactly where error handling lives, two chapters from now.",
  });
  tl.tween(stageDim, 0.15, { at: 70.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 71.8, dur: 0.9, ease: ease.enter });
  tl.hold(75.9, 1.6);

  return {
    tl,
    cam,
    bracketsU,
    codeU,
    jU,
    p1U,
    p2U,
    tapeN,
    floorU,
    checkU,
    timerU,
    braceU,
    flowU,
    stageDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function PauseBadge({ x, y, u, resumed }: { x: number; y: number; u: number; resumed: boolean }) {
  if (u <= 0) return null;
  return (
    <g opacity={u} transform={`translate(${x}, ${y})`}>
      <circle r={13} fill={colors.PANEL} stroke={resumed ? colors.POSITIVE : colors.WARM} strokeWidth={1.6} />
      <rect x={-4.5} y={-5} width={3.2} height={10} rx={1} fill={resumed ? colors.POSITIVE : colors.WARM} />
      <rect x={1.3} y={-5} width={3.2} height={10} rx={1} fill={resumed ? colors.POSITIVE : colors.WARM} />
    </g>
  );
}

function LegLabel({ x, y, text, color, u, anchor }: { x: number; y: number; text: string; color: string; u: number; anchor: 'start' | 'end' }) {
  if (u <= 0) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={12.5} fontFamily="monospace" opacity={u}>
      {text}
    </text>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const bracketsU = s.get(scene.bracketsU);
  const codeU = s.get(scene.codeU);
  const jU = s.get(scene.jU);
  const p1U = s.get(scene.p1U);
  const p2U = s.get(scene.p2U);
  const tapeN = s.get(scene.tapeN);
  const floorU = s.get(scene.floorU);
  const checkU = s.get(scene.checkU);
  const timerU = s.get(scene.timerU);
  const braceU = s.get(scene.braceU);
  const flowU = s.get(scene.flowU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  const pos = dotAt(jU);
  const dotVisible = jU > 0.02 && jU < 9.98;
  const b1 = clamp01(bracketsU);
  const b2 = clamp01(bracketsU - 1);

  // right legs stay dim while their middleware is parked
  const leg1Glow = 1 - 0.6 * p1U;
  const leg2Glow = 1 - 0.6 * p2U;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the two brackets (the onion, cut open) ---- */}
        {b1 > 0 && (
          <g opacity={stageDim}>
            <path d={bracketPath(OUT)} fill="none" stroke={colors.ACCENT} strokeWidth={26} opacity={0.1 * b1 * leg1Glow} strokeLinejoin="round" />
            <path
              d={bracketPath(OUT)}
              fill="none"
              stroke={colors.ACCENT}
              strokeWidth={1.8}
              opacity={0.85 * b1 * leg1Glow}
              strokeLinejoin="round"
              strokeDasharray={1440}
              strokeDashoffset={1440 * (1 - b1)}
            />
            <text x={OUT.l - 24} y={OUT.top - 12} textAnchor="start" fill={colors.ACCENT} fontSize={14} opacity={b1}>
              middleware one
            </text>
          </g>
        )}
        {b2 > 0 && (
          <g opacity={stageDim}>
            <path d={bracketPath(INN)} fill="none" stroke={colors.SECONDARY} strokeWidth={26} opacity={0.1 * b2 * leg2Glow} strokeLinejoin="round" />
            <path
              d={bracketPath(INN)}
              fill="none"
              stroke={colors.SECONDARY}
              strokeWidth={1.8}
              opacity={0.85 * b2 * leg2Glow}
              strokeLinejoin="round"
              strokeDasharray={1000}
              strokeDashoffset={1000 * (1 - b2)}
            />
            <text x={INN.l - 24} y={INN.top - 12} textAnchor="start" fill={colors.SECONDARY} fontSize={14} opacity={b2}>
              middleware two
            </text>
          </g>
        )}

        {/* ---- code on the legs (the exact test trace) ---- */}
        <g opacity={codeU * stageDim}>
          <LegLabel x={OUT.l - 16} y={250} text="calls.push(1)" color={colors.ACCENT} u={codeU} anchor="end" />
          <LegLabel x={OUT.l - 16} y={300} text="await next()" color={colors.MUTED} u={codeU} anchor="end" />
          <LegLabel x={OUT.r + 16} y={250} text="calls.push(4)" color={colors.ACCENT} u={codeU} anchor="start" />
          <LegLabel x={INN.l - 16} y={390} text="calls.push(2)" color={colors.SECONDARY} u={codeU} anchor="end" />
          <LegLabel x={INN.l - 16} y={432} text="await next()" color={colors.MUTED} u={codeU} anchor="end" />
          <LegLabel x={INN.r + 16} y={390} text="calls.push(3)" color={colors.SECONDARY} u={codeU} anchor="start" />
        </g>

        {/* ---- the pause badges on the parked halves ---- */}
        <PauseBadge x={OUT.r} y={250} u={Math.max(p1U, clamp01(checkU))} resumed={p1U < 0.5 && jU > 8.5} />
        <PauseBadge x={INN.r} y={390} u={Math.max(p2U, clamp01(checkU) * 0)} resumed={p2U < 0.5 && jU > 6.5} />

        {/* ---- the floor: Promise.resolve() ---- */}
        {floorU > 0 && (
          <g opacity={floorU * stageDim}>
            <circle cx={700} cy={INN.bot} r={34} fill={colors.WARM} opacity={0.14} />
            <circle cx={700} cy={INN.bot} r={34} fill="none" stroke={colors.WARM} strokeWidth={1.6} />
            <text x={700} y={INN.bot + 56} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              i === length → Promise.resolve()
            </text>
          </g>
        )}

        {/* ---- the ticker tape ---- */}
        <g opacity={Math.max(codeU, clamp01(tapeN)) * stageDim}>
          <text x={1075} y={92} textAnchor="start" fill={colors.MUTED} fontSize={13} fontFamily="monospace">
            calls =
          </text>
          {[1, 2, 3, 4].map((n, i) => {
            const u = clamp01((tapeN - i) * 2.5);
            return (
              <g key={n} opacity={u} transform={`translate(${1085 + i * 40}, ${124})`}>
                <rect x={-15} y={-15} width={30} height={30} rx={7} fill={colors.PANEL} stroke={i % 3 === 0 ? colors.ACCENT : colors.SECONDARY} strokeWidth={1.4} />
                <text x={0} y={5.5} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontFamily="monospace" fontWeight={700}>
                  {n}
                </text>
              </g>
            );
          })}
          {checkU > 0 && (
            <g opacity={checkU}>
              <text x={1075} y={172} textAnchor="start" fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                deepStrictEqual ✓
              </text>
              <text x={1075} y={190} textAnchor="start" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                [1, 2, 3, 4]
              </text>
            </g>
          )}
        </g>

        {/* ---- the request dot ---- */}
        {dotVisible && (
          <g>
            <circle cx={pos.x} cy={pos.y} r={11} fill={colors.TEXT} />
            <circle cx={pos.x} cy={pos.y} r={11} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
            <text x={pos.x + 20} y={pos.y + 4} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
              ctx
            </text>
          </g>
        )}

        {/* ---- the logger clock replay ---- */}
        {timerU > 0 && (
          <g opacity={stageDim}>
            <TimerArc cx={OUT.l - 60} cy={180} r={18} u={timerU} color={colors.WARM} />
            <text x={OUT.l - 60} y={148} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="monospace">
              const start = Date.now()
            </text>
            {timerU >= 1 && (
              <text x={OUT.r + 60} y={180} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="monospace">
                ms = Date.now() - start
              </text>
            )}
          </g>
        )}
        {braceU > 0 && (
          <g opacity={stageDim}>
            <Brace x0={INN.l - 35} x1={INN.r + 35} y={OUT.bot + 18} below u={braceU} color={colors.WARM} label="everything below the await gets timed" />
          </g>
        )}

        {/* ---- downstream / upstream arrows ---- */}
        {flowU > 0 && (
          <g opacity={flowU * stageDim}>
            <line x1={OUT.l - 52} y1={210} x2={OUT.l - 52} y2={lerp(210, 480, flowU)} stroke={colors.ACCENT} strokeWidth={2.5} />
            <path d={`M ${OUT.l - 58} ${lerp(210, 480, flowU) - 8} L ${OUT.l - 52} ${lerp(210, 480, flowU)} L ${OUT.l - 46} ${lerp(210, 480, flowU) - 8}`} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} />
            <text x={OUT.l - 70} y={340} textAnchor="middle" fill={colors.ACCENT} fontSize={13} transform={`rotate(-90 ${OUT.l - 70} 340)`}>
              downstream — actions
            </text>
            <line x1={OUT.r + 52} y1={480} x2={OUT.r + 52} y2={lerp(480, 210, flowU)} stroke={colors.POSITIVE} strokeWidth={2.5} />
            <path d={`M ${OUT.r + 46} ${lerp(480, 210, flowU) + 8} L ${OUT.r + 52} ${lerp(480, 210, flowU)} L ${OUT.r + 58} ${lerp(480, 210, flowU) + 8}`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
            <text x={OUT.r + 74} y={340} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} transform={`rotate(90 ${OUT.r + 74} 340)`}>
              upstream — filters
            </text>
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={370} y={255} width={540} height={112} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={301} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              halves unwind in reverse
            </text>
            <text x={640} y={337} textAnchor="middle" fill={colors.ACCENT} fontSize={21} fontWeight={700}>
              whatever runs first gets the last word
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
