// A Recipe, Not a Meal
//
// Backing files: packages/effect/src/Effect.ts (the Effect interface doc —
// "a value that lazily describes a workflow or job" — plus Effect.sync,
// Effect.succeed and Effect.runSync) and packages/effect/src/internal/effect.ts
// (sync is makePrimitive({ op: "Sync" }) — an Effect literally is an inert
// object carrying an op tag and a frozen thunk).
//
// Centerpiece: the minting bench and the silent console. Calling console.log
// fires the moment it is written; wrapping the same code in Effect.sync mints
// an inert op-tagged card that does nothing — copy it, shelve it, still
// nothing — until Effect.runSync feeds it to a fiber and the console finally
// prints. Run it twice, it prints twice.
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
// Layout — bench on the left, the outside world (console) on the right,
// the fiber machine between them.
// ---------------------------------------------------------------------------

const CARD = { x: 110, y: 265, w: 330, h: 168 } as const;
const CONSOLE = { x: 872, y: 140, w: 356, h: 380 } as const;
const FIBER = { x: 552, y: 430, w: 224, h: 128 } as const;

// spark flight: fiber exhaust → console margin, a gentle arc
const SPARK_FROM = { x: FIBER.x + FIBER.w, y: FIBER.y + FIBER.h / 2 } as const;
const sparkPos = (u: number, lineY: number): { x: number; y: number } => {
  const to = { x: CONSOLE.x + 26, y: lineY };
  const cx = (SPARK_FROM.x + to.x) / 2 + 40;
  const cy = Math.min(SPARK_FROM.y, lineY) - 90;
  const v = 1 - u;
  return {
    x: v * v * SPARK_FROM.x + 2 * v * u * cx + u * u * to.x,
    y: v * v * SPARK_FROM.y + 2 * v * u * cy + u * u * to.y,
  };
};

// camera marks
const CAM_OPEN: CameraState = { x: 640, y: 330, k: 1.06 };
const CAM_BENCH: CameraState = { x: 420, y: 300, k: 1.3 };
const CAM_WORLD: CameraState = { x: 820, y: 310, k: 1.12 };
const CAM_FIBER: CameraState = { x: 700, y: 400, k: 1.14 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  hookU: ChannelRef<number>;
  rawU: ChannelRef<number>;
  rawSpark: ChannelRef<number>;
  rawDim: ChannelRef<number>;
  wrapU: ChannelRef<number>;
  copiesU: ChannelRef<number>;
  typeU: ChannelRef<number>;
  quoteU: ChannelRef<number>;
  fiberU: ChannelRef<number>;
  run1U: ChannelRef<number>;
  spark1: ChannelRef<number>;
  run2U: ChannelRef<number>;
  spark2: ChannelRef<number>;
  spin: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);
  const hookU = tl.channel('hookU', 0);
  const rawU = tl.channel('rawU', 0);
  const rawSpark = tl.channel('rawSpark', 0);
  const rawDim = tl.channel('rawDim', 1);
  const wrapU = tl.channel('wrapU', 0);
  const copiesU = tl.channel('copiesU', 0);
  const typeU = tl.channel('typeU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const fiberU = tl.channel('fiberU', 0);
  const run1U = tl.channel('run1U', 0);
  const spark1 = tl.channel('spark1', 0);
  const run2U = tl.channel('run2U', 0);
  const spark2 = tl.channel('spark2', 0);
  const spin = tl.channel('spin', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the hook: a program as a value —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Here is a strange idea to start a library with. What if a whole program were just a value? Something you could hold, copy, and hand around, like a number.',
  });
  tl.tween(hookU, 1, { at: 0.5, dur: 0.9, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 320, k: 1.14 }, { at: 0.8, dur: 3.4, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the familiar world: calling a function runs it now —
  tl.caption({
    at: 7.2,
    dur: 7.0,
    text: 'First, the familiar world. Call a function that logs to the console, and it runs the moment you call it. Definition and execution happen together, ready or not.',
  });
  tl.tween(hookU, 0, { at: 7.0, dur: 0.6, ease: ease.move });
  tl.tween(rawU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_WORLD, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.tween(rawSpark, 1, { at: 9.2, dur: 1.1, ease: ease.linear });
  tl.hold(14.2, 0.4);

  // — Beat 3 · wrap it: Effect.sync mints an inert card —
  tl.caption({
    at: 14.8,
    dur: 7.0,
    text: 'Now wrap that same code in the sync constructor. Out comes a value: a little frozen object holding your function. And look at the console. Nothing happened.',
  });
  tl.tween(rawDim, 0.12, { at: 14.9, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_BENCH, { at: 15.0, dur: 1.5, ease: ease.move });
  tl.tween(wrapU, 1, { at: 15.8, dur: 1.1, ease: ease.enter });
  tl.hold(21.8, 0.5);

  // — Beat 4 · value things: copy it, shelve it —
  tl.caption({
    at: 22.4,
    dur: 7.4,
    text: 'Because this is just a value, you can do value things with it. Copy it three times. Put the copies in a list. Pass them to a function. The world still has not changed.',
  });
  tl.tween(copiesU, 1, { at: 23.0, dur: 2.2, ease: ease.move });
  tl.hold(29.8, 0.5);

  // — Beat 5 · the source's own words —
  tl.caption({
    at: 30.5,
    dur: 7.0,
    text: 'The source says it plainly: an Effect is a value that lazily describes a workflow or job. A description of a computation. A recipe, not a meal.',
  });
  tl.tween(typeU, 1, { at: 30.8, dur: 0.7, ease: ease.enter });
  tl.tween(quoteU, 1, { at: 32.2, dur: 0.9, ease: ease.enter });
  tl.hold(37.5, 0.5);

  // — Beat 6 · runSync: hand the card to a fiber —
  tl.caption({
    at: 38.2,
    dur: 7.6,
    text: 'To make something actually happen, you hand the description to the runtime. Run sync feeds our card to a fiber, the fiber evaluates the frozen function, and now the console prints.',
  });
  tl.tween(quoteU, 0, { at: 38.0, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_FIBER, { at: 38.4, dur: 1.5, ease: ease.move });
  tl.tween(fiberU, 1, { at: 38.8, dur: 0.8, ease: ease.enter });
  tl.tween(run1U, 1, { at: 40.2, dur: 1.4, ease: ease.move });
  tl.tween(spin, 2, { at: 40.4, dur: 5.0, ease: ease.linear });
  tl.tween(spark1, 1, { at: 42.0, dur: 1.2, ease: ease.linear });
  tl.hold(45.4, 0.4);

  // — Beat 7 · run it again —
  tl.caption({
    at: 46.4,
    dur: 6.6,
    text: 'And because the description survives the run, you can run it again. Same recipe, second meal. Try doing that with code that already executed.',
  });
  tl.tween(run2U, 1, { at: 47.2, dur: 1.4, ease: ease.move });
  tl.tween(spin, 4, { at: 47.2, dur: 4.4, ease: ease.linear });
  tl.tween(spark2, 1, { at: 49.0, dur: 1.2, ease: ease.linear });
  tl.hold(52.6, 0.4);

  // — Beat 8 · close —
  tl.caption({
    at: 53.6,
    dur: 7.6,
    text: 'So hold onto this picture. Creating an Effect does nothing. Running it is a separate, deliberate act. Everything else in this book is about composing these descriptions.',
  });
  tl.tween(cam, CAM_WIDE, { at: 53.8, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 0.12, { at: 54.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.6, dur: 0.9, ease: ease.enter });
  tl.hold(60.8, 1.4);

  return {
    tl,
    cam,
    hookU,
    rawU,
    rawSpark,
    rawDim,
    wrapU,
    copiesU,
    typeU,
    quoteU,
    fiberU,
    run1U,
    spark1,
    run2U,
    spark2,
    spin,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local vocabulary — the effect card, the console, the fiber machine.
// Pure functions of sampled values only.
// ---------------------------------------------------------------------------

function EffectCard({ x, y, scale = 1, opacity = 1 }: {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <rect width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
      <rect x={14} y={12} width={104} height={22} rx={11} fill={colors.BG} stroke={colors.GRID} />
      <text x={66} y={27} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
        op: "Sync"
      </text>
      <rect x={14} y={46} width={CARD.w - 28} height={74} rx={8} fill={colors.BG} stroke={colors.GRID} strokeDasharray="5 5" />
      <text x={26} y={76} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
        {'() => console.log('}
      </text>
      <text x={44} y={96} fill={colors.WARM} fontSize={12.5} fontFamily="monospace">
        "Hello, World!"
      </text>
      <text x={26} y={112} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
        {')'}
      </text>
      <text x={CARD.w - 16} y={62} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
        frozen thunk
      </text>
      <text x={14} y={CARD.h - 14} fill={colors.MUTED} fontSize={11}>
        an inert object — nothing runs
      </text>
    </g>
  );
}

interface ConsoleLine {
  text: string;
  u: number;
  note?: string;
}

function ConsolePanel({ dim, lines, ghostU }: { dim: number; lines: ConsoleLine[]; ghostU: number }) {
  return (
    <g>
      <rect x={CONSOLE.x} y={CONSOLE.y} width={CONSOLE.w} height={CONSOLE.h} rx={12} fill="#050810" stroke={colors.GRID} />
      <text x={CONSOLE.x + 16} y={CONSOLE.y - 12} fill={colors.MUTED} fontSize={13}>
        the outside world — console
      </text>
      <circle cx={CONSOLE.x + 20} cy={CONSOLE.y + 20} r={4} fill={colors.NEGATIVE} opacity={0.7} />
      <circle cx={CONSOLE.x + 36} cy={CONSOLE.y + 20} r={4} fill={colors.WARM} opacity={0.7} />
      <circle cx={CONSOLE.x + 52} cy={CONSOLE.y + 20} r={4} fill={colors.POSITIVE} opacity={0.7} />
      {ghostU > 0.01 && (
        <text x={CONSOLE.x + CONSOLE.w / 2} y={CONSOLE.y + 200} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={ghostU * 0.65}>
          — no output —
        </text>
      )}
      {lines.map((l, i) => {
        const y = CONSOLE.y + 58 + i * 40;
        if (l.u <= 0.01) return null;
        return (
          <g key={i} opacity={l.u * dim}>
            <text x={CONSOLE.x + 20} y={y} fill={colors.POSITIVE} fontSize={13.5} fontFamily="monospace">
              {'> '}
              {l.text}
            </text>
            {l.note && (
              <text x={CONSOLE.x + 20} y={y + 17} fill={colors.MUTED} fontSize={10.5} fontStyle="italic">
                {l.note}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function FiberMachine({ u, spin }: { u: number; spin: number }) {
  if (u <= 0.01) return null;
  const cx = FIBER.x + FIBER.w / 2;
  const cy = FIBER.y + FIBER.h / 2;
  return (
    <g opacity={u}>
      <rect x={FIBER.x} y={FIBER.y} width={FIBER.w} height={FIBER.h} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
      <text x={cx} y={FIBER.y - 12} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>
        a fiber — the thing that runs
      </text>
      {/* intake slot */}
      <rect x={FIBER.x - 6} y={cy - 22} width={12} height={44} rx={4} fill={colors.BG} stroke={colors.GRID} />
      {/* rotor: pure function of the spin channel */}
      <g transform={`rotate(${spin * 180} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={34} fill="none" stroke={colors.SECONDARY} strokeWidth={2} opacity={0.8} />
        {[0, 60, 120].map((a) => (
          <line
            key={a}
            x1={cx + 34 * Math.cos((a * Math.PI) / 180)}
            y1={cy + 34 * Math.sin((a * Math.PI) / 180)}
            x2={cx - 34 * Math.cos((a * Math.PI) / 180)}
            y2={cy - 34 * Math.sin((a * Math.PI) / 180)}
            stroke={colors.SECONDARY}
            strokeWidth={2}
            opacity={0.55}
          />
        ))}
      </g>
      <text x={cx} y={FIBER.y + FIBER.h + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
        Effect.runSync(program)
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const hookU = s.get(scene.hookU);
  const rawU = s.get(scene.rawU);
  const rawSpark = s.get(scene.rawSpark);
  const rawDim = s.get(scene.rawDim);
  const wrapU = s.get(scene.wrapU);
  const copiesU = s.get(scene.copiesU);
  const typeU = s.get(scene.typeU);
  const quoteU = s.get(scene.quoteU);
  const fiberU = s.get(scene.fiberU);
  const run1U = s.get(scene.run1U);
  const spark1 = s.get(scene.spark1);
  const run2U = s.get(scene.run2U);
  const spark2 = s.get(scene.spark2);
  const spin = s.get(scene.spin);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  // raw spark: from the raw code chip straight to the console
  const rawSparkPos = {
    x: lerp(560, CONSOLE.x + 26, rawSpark),
    y: lerp(206, CONSOLE.y + 54, rawSpark),
  };

  // card 1 flight into the fiber intake
  const c1x = lerp(CARD.x, FIBER.x - 40, run1U);
  const c1y = lerp(CARD.y, FIBER.y + 24, run1U);
  const c1s = 1 - 0.68 * run1U;
  // card 2 (a copy) flight
  const c2x = lerp(CARD.x + 30, FIBER.x - 40, run2U);
  const c2y = lerp(CARD.y + 22, FIBER.y + 24, run2U);
  const c2s = 1 - 0.68 * run2U;

  const sp1 = sparkPos(spark1, CONSOLE.y + 96);
  const sp2 = sparkPos(spark2, CONSOLE.y + 136);

  const lines: ConsoleLine[] = [
    { text: 'Hello, World!', u: clamp01(rawSpark * 5 - 4) * rawDim, note: 'printed at definition time' },
    { text: 'Hello, World!', u: clamp01(spark1 * 5 - 4), note: 'first run' },
    { text: 'Hello, World!', u: clamp01(spark2 * 5 - 4), note: 'second run' },
  ];
  const anyPrint = Math.max(clamp01(spark1 * 5 - 4), clamp01(spark2 * 5 - 4));
  const ghostU = wrapU * (1 - clamp01(rawSpark * 5 - 4) * rawDim) * (1 - anyPrint);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the hook: a ghost card ---- */}
        {hookU > 0.01 && (
          <g opacity={hookU}>
            <rect x={460} y={210} width={360} height={200} rx={16} fill="none" stroke={colors.ACCENT} strokeWidth={1.6} strokeDasharray="10 8" opacity={0.8} />
            <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
              a program…
            </text>
            <text x={640} y={330} textAnchor="middle" fill={colors.ACCENT} fontSize={19} fontWeight={600}>
              …as a value?
            </text>
          </g>
        )}

        {/* ---- the familiar world: raw call ---- */}
        <g opacity={rawU * rawDim * dimU}>
          <rect x={90} y={168} width={452} height={52} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={110} y={200} fill={colors.TEXT} fontSize={14} fontFamily="monospace">
            console.log(<tspan fill={colors.WARM}>"Hello, World!"</tspan>)
          </text>
          <text x={110} y={150} fill={colors.MUTED} fontSize={13}>
            plain JavaScript — runs when written
          </text>
        </g>
        {rawSpark > 0.01 && rawSpark < 0.99 && (
          <circle cx={rawSparkPos.x} cy={rawSparkPos.y} r={6} fill={colors.WARM} opacity={rawDim} />
        )}

        {/* ---- the console ---- */}
        <g opacity={dimU}>
          <ConsolePanel dim={1} lines={lines} ghostU={ghostU} />
        </g>

        {/* ---- the minting bench ---- */}
        <g opacity={wrapU * dimU}>
          <rect x={80} y={128} width={470} height={56} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={98} y={151} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
            const program = <tspan fill={colors.ACCENT}>Effect.sync</tspan>(
          </text>
          <text x={124} y={170} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
            {'() => console.log('}<tspan fill={colors.WARM}>"Hello, World!"</tspan>{'))'}
          </text>
        </g>

        {/* copies behind the main card */}
        <g opacity={dimU}>
          {[2, 1].map((i) => (
            <EffectCard
              key={i}
              x={CARD.x + i * 30}
              y={CARD.y + i * 22}
              opacity={clamp01(copiesU * 3 - i) * 0.55 * (i === 1 ? 1 - run2U : 1)}
            />
          ))}
          {/* copy 1 in flight for run 2 */}
          {run2U > 0.01 && run2U < 0.98 && <EffectCard x={c2x} y={c2y} scale={c2s} opacity={0.9} />}
          {/* the main card (run 1) */}
          {run1U < 0.98 && <EffectCard x={c1x} y={c1y} scale={c1s} opacity={wrapU} />}
          {copiesU > 0.01 && (
            <text x={CARD.x + 10} y={CARD.y + CARD.h + 62} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={copiesU * (1 - run2U)}>
              const copies = [program, program, program]
            </text>
          )}
        </g>

        {/* type chip + source quote */}
        {typeU > 0.01 && (
          <g opacity={typeU * dimU}>
            <rect x={CARD.x} y={CARD.y - 46} width={262} height={30} rx={8} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.2} />
            <text x={CARD.x + 131} y={CARD.y - 26} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
              {'Effect<void, never, never>'}
            </text>
          </g>
        )}
        {quoteU > 0.01 && (
          <g opacity={quoteU * dimU}>
            <rect x={560} y={230} width={420} height={120} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={580} y={270} fill={colors.TEXT} fontSize={14.5} fontStyle="italic">
              “a value that lazily describes
            </text>
            <text x={580} y={294} fill={colors.TEXT} fontSize={14.5} fontStyle="italic">
              a workflow or job”
            </text>
            <text x={960} y={330} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
              — packages/effect/src/Effect.ts
            </text>
          </g>
        )}

        {/* ---- the fiber machine ---- */}
        <g opacity={dimU}>
          <FiberMachine u={fiberU} spin={spin} />
        </g>
        {spark1 > 0.01 && spark1 < 0.99 && <circle cx={sp1.x} cy={sp1.y} r={6} fill={colors.POSITIVE} opacity={dimU} />}
        {spark2 > 0.01 && spark2 < 0.99 && <circle cx={sp2.x} cy={sp2.y} r={6} fill={colors.POSITIVE} opacity={dimU} />}

        {/* ---- closing panel ---- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={340} y={240} width={600} height={160} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              an Effect is a description
            </text>
            <text x={640} y={348} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              running it is a separate act
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
