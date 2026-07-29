// The Program Is a Data Structure
//
// Grounding: packages/effect/src/internal/core.ts — the Primitive interface
// (identifier/op, args, [evaluate](fiber), successCont) and makePrimitive;
// exitSucceed (op "Success"); packages/effect/src/internal/effect.ts —
// flatMap builds an OnSuccess primitive (OnSuccessProto), sync (op "Sync"),
// FiberImpl (id, context, interruptible, _stack) and runForkWith (new
// FiberImpl + fiber.evaluate).
//
// Centerpiece: the program assembling itself as a chain of frozen instruction
// cards — op tag, args, evaluate — while an "instructions executed" counter
// stays pinned at zero. Then Effect.runFork births a fiber panel and the
// outermost card is loaded into its current slot. Nothing has run yet.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** Per-item window over one 0..1 driver channel (the stagger trick). */
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — code card, the instruction chain, the zero-meter, the fiber panel.
// ---------------------------------------------------------------------------

const CODE = { x: 56, y: 116, w: 330, h: 172 } as const;
const CODE_LINES = [
  'const program = Effect.succeed(2).pipe(',
  '  Effect.flatMap((n) =>',
  '    Effect.sync(() => n * 21)),',
  '  Effect.flatMap((n) =>',
  '    Effect.sync(() => "answer: " + n)))',
] as const;

// instruction cards — built bottom-up: A = Success leaf, B and C wrap it.
const CARD_W = 250;
const CARD_A = { x: 470, y: 128, w: CARD_W, h: 96 } as const; // Success(2)
const CARD_B = { x: 470, y: 268, w: CARD_W, h: 96 } as const; // OnSuccess(double)
const CARD_C = { x: 470, y: 408, w: CARD_W, h: 96 } as const; // OnSuccess(format)
const METER = { x: 1010, y: 108 } as const;
const FIBER = { x: 930, y: 236, w: 292, h: 330 } as const;
const SLOT = { x: FIBER.x + 26, y: FIBER.y + 92, w: FIBER.w - 52, h: 74 } as const;

const CAM_CODE: CameraState = { x: 400, y: 300, k: 1.28 };
const CAM_CARD: CameraState = { x: CARD_A.x + CARD_A.w / 2 + 40, y: CARD_A.y + 100, k: 1.62 };
const CAM_CHAIN: CameraState = { x: 620, y: 330, k: 1.12 };
const CAM_FIBER: CameraState = { x: 860, y: 370, k: 1.16 };

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

// the outermost card (C) travels into the fiber's current slot
const ROOT_PATH = [
  { x: CARD_C.x + CARD_C.w / 2, y: CARD_C.y + CARD_C.h / 2 },
  { x: 800, y: 380 },
  { x: SLOT.x + SLOT.w / 2, y: SLOT.y + SLOT.h / 2 },
];

// ---------------------------------------------------------------------------
// Timeline (~80s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CODE, cameraInterp);

  const codeU = tl.channel('codeU', 0); // code lines stagger in
  const cardAU = tl.channel('cardAU', 0); // Success(2) card
  const anatU = tl.channel('anatU', 0); // the three anatomy rows light up
  const cardBU = tl.channel('cardBU', 0); // OnSuccess(double) card + pointer
  const cardCU = tl.channel('cardCU', 0); // OnSuccess(format) card + pointer
  const meterU = tl.channel('meterU', 0); // "instructions executed: 0"
  const meterPulse = tl.channel('meterPulse', 0); // ring pulse on the zero
  const forkU = tl.channel('forkU', 0); // Effect.runFork chip
  const fiberU = tl.channel('fiberU', 0); // fiber panel slides in
  const rowsU = tl.channel('rowsU', 0); // fiber field rows stagger
  const rootU = tl.channel('rootU', 0); // root card travels into the slot
  const dimU = tl.channel('dimU', 0); // left side fades for the ending

  // — beat 1 · nothing runs —
  tl.caption({
    at: 0.5,
    dur: 7.0,
    text: 'Here is the strangest fact about Effect: building a program runs nothing. Before we meet the machine that eventually does, look hard at the frozen part.',
  });
  tl.tween(codeU, 1, { at: 0.7, dur: 2.2, ease: ease.linear });
  tl.tween(meterU, 1, { at: 4.6, dur: 0.7, ease: ease.enter });
  tl.hold(7.5, 0.6);

  // — beat 2 · succeed returns an object —
  tl.caption({
    at: 8.1,
    dur: 6.6,
    text: "Call succeed with the number two and you don't get two back. You get an object — an instruction card with an op tag and the value tucked inside.",
  });
  tl.tween(cam, CAM_CARD, { at: 8.3, dur: 1.3, ease: ease.move });
  tl.tween(cardAU, 1, { at: 9.0, dur: 0.8, ease: ease.enter });
  tl.hold(14.7, 0.6);

  // — beat 3 · the anatomy —
  tl.caption({
    at: 15.3,
    dur: 7.0,
    text: 'Every instruction shares one anatomy: an op name, its arguments, and a method called evaluate that knows how to perform this one step when a machine asks.',
  });
  tl.tween(anatU, 1, { at: 15.7, dur: 2.4, ease: ease.linear });
  tl.hold(22.3, 0.7);

  // — beat 4 · flatMap allocates, never calls —
  tl.caption({
    at: 23.0,
    dur: 7.4,
    text: 'Flat map does not call your function. It allocates a new instruction — on success — holding the inner effect on one side and your function on the other. Still nothing runs.',
  });
  tl.tween(cam, CAM_CHAIN, { at: 23.2, dur: 1.4, ease: ease.move });
  tl.tween(cardBU, 1, { at: 24.2, dur: 1.0, ease: ease.enter });
  tl.hold(30.4, 0.6);

  // — beat 5 · the chain is the program —
  tl.caption({
    at: 31.0,
    dur: 6.2,
    text: 'Keep chaining and you build a linked structure of instructions. Your entire program is a data structure — a plan sitting in memory, waiting.',
  });
  tl.tween(cardCU, 1, { at: 31.6, dur: 1.0, ease: ease.enter });
  tl.hold(37.2, 0.8);

  // — beat 6 · the counter says zero —
  tl.caption({
    at: 38.0,
    dur: 6.2,
    text: "Don't take my word for it — the counter says zero instructions executed. Describing work and doing work are two different events.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 38.2, dur: 1.3, ease: ease.move });
  tl.tween(meterPulse, 3, { at: 39.4, dur: 3.2, ease: ease.linear });
  tl.hold(44.2, 0.7);

  // — beat 7 · runFork births a fiber —
  tl.caption({
    at: 44.9,
    dur: 7.4,
    text: 'Doing work takes a machine. Run fork allocates a fiber — a tiny virtual thread with an id, a context of services, an interruptible flag, and an empty stack.',
  });
  tl.tween(forkU, 1, { at: 45.1, dur: 0.6, ease: ease.pop });
  tl.tween(cam, CAM_FIBER, { at: 45.9, dur: 1.4, ease: ease.move });
  tl.tween(fiberU, 1, { at: 46.3, dur: 0.9, ease: ease.enter });
  tl.tween(rowsU, 1, { at: 47.2, dur: 2.0, ease: ease.linear });
  tl.hold(52.3, 0.6);

  // — beat 8 · the unit of execution —
  tl.caption({
    at: 52.9,
    dur: 6.4,
    text: "The fiber is Effect's unit of execution. Every running program in every Effect app is exactly this: one fiber, chewing through instruction objects.",
  });
  tl.hold(59.3, 0.6);

  // — beat 9 · load the root, tease the loop —
  tl.caption({
    at: 59.9,
    dur: 7.2,
    text: 'The fiber loads the outermost instruction into its current slot, and the wheel is ready to turn. What happens when it does — that is the run loop, and the next chapter.',
  });
  tl.tween(dimU, 1, { at: 60.1, dur: 1.2, ease: ease.move });
  tl.tween(rootU, 1, { at: 61.0, dur: 1.8, ease: ease.move });
  tl.hold(67.1, 1.6);

  return {
    tl,
    cam,
    codeU,
    cardAU,
    anatU,
    cardBU,
    cardCU,
    meterU,
    meterPulse,
    forkU,
    fiberU,
    rowsU,
    rootU,
    dimU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

interface CardSpec {
  box: { x: number; y: number; w: number; h: number };
  op: string;
  argsLabel: string;
  contLabel?: string;
  color: string;
}

function InstrCard({ spec, u, anat = 1 }: { spec: CardSpec; u: number; anat?: number }) {
  if (u <= 0) return null;
  const { box } = spec;
  return (
    <g opacity={u} transform={`translate(0 ${(1 - u) * 14})`}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12} fill={colors.PANEL} stroke={spec.color} strokeWidth={1.5} />
      <text x={box.x + 16} y={box.y + 26} fill={spec.color} fontSize={14.5} fontFamily={MONO} fontWeight={700}>
        op: "{spec.op}"
      </text>
      <g opacity={anat}>
        <text x={box.x + 16} y={box.y + 50} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
          {spec.argsLabel}
        </text>
        <text x={box.x + 16} y={box.y + 74} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
          {spec.contLabel ?? 'evaluate(fiber)'}
        </text>
      </g>
    </g>
  );
}

const SPEC_A: CardSpec = {
  box: CARD_A,
  op: 'Success',
  argsLabel: 'args: 2',
  contLabel: 'evaluate(fiber)',
  color: colors.POSITIVE,
};
const SPEC_B: CardSpec = {
  box: CARD_B,
  op: 'OnSuccess',
  argsLabel: 'args: ↑ Success',
  contLabel: 'successCont: (n) => …',
  color: colors.ACCENT,
};
const SPEC_C: CardSpec = {
  box: CARD_C,
  op: 'OnSuccess',
  argsLabel: 'args: ↑ OnSuccess',
  contLabel: 'successCont: (n) => …',
  color: colors.ACCENT,
};

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const codeU = s.get(scene.codeU);
  const cardAU = s.get(scene.cardAU);
  const anatU = s.get(scene.anatU);
  const cardBU = s.get(scene.cardBU);
  const cardCU = s.get(scene.cardCU);
  const meterU = s.get(scene.meterU);
  const meterPulse = s.get(scene.meterPulse);
  const forkU = s.get(scene.forkU);
  const fiberU = s.get(scene.fiberU);
  const rowsU = s.get(scene.rowsU);
  const rootU = s.get(scene.rootU);
  const dimU = s.get(scene.dimU);

  const leftOp = 1 - 0.86 * dimU;
  const pulse = 0.5 + 0.5 * Math.cos(Math.PI * 2 * meterPulse); // 3 soft pulses
  const rootPos = along(ROOT_PATH, rootU);
  const rootScale = 1 - 0.2 * rootU;

  const fiberRows: Array<[string, string]> = [
    ['id: 1', ''],
    ['interruptible: true', ''],
    ['_stack: []', ''],
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* your code */}
        <g opacity={leftOp}>
          <rect x={CODE.x} y={CODE.y} width={CODE.w} height={CODE.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={CODE.x + 20} y={CODE.y + 28} fill={colors.MUTED} fontSize={12.5} fontStyle="italic">
            your code — not yet a computation
          </text>
          {CODE_LINES.map((line, i) => {
            const u = win(codeU, CODE_LINES.length, i, 1.6);
            return (
              <text key={i} x={CODE.x + 20} y={CODE.y + 56 + i * 22} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO} opacity={u}>
                {line}
              </text>
            );
          })}
        </g>

        {/* the instruction chain */}
        <g opacity={leftOp}>
          <InstrCard spec={SPEC_A} u={cardAU} anat={anatU} />
          {/* rootU moves card C into the slot; render it separately below */}
          <InstrCard spec={SPEC_B} u={cardBU} />
          {cardBU > 0.5 && (
            <g opacity={(cardBU - 0.5) * 2}>
              <path
                d={`M ${CARD_B.x + 44} ${CARD_B.y} L ${CARD_A.x + 44} ${CARD_A.y + CARD_A.h + 6}`}
                stroke={colors.ACCENT}
                strokeWidth={1.5}
                markerEnd="url(#ch1-arrow)"
                fill="none"
              />
            </g>
          )}
          {cardCU > 0.5 && (
            <g opacity={(cardCU - 0.5) * 2}>
              <path
                d={`M ${CARD_C.x + 44} ${CARD_C.y} L ${CARD_B.x + 44} ${CARD_B.y + CARD_B.h + 6}`}
                stroke={colors.ACCENT}
                strokeWidth={1.5}
                markerEnd="url(#ch1-arrow)"
                fill="none"
              />
            </g>
          )}
          {/* the file this machinery lives in */}
          <text x={CARD_A.x + CARD_A.w + 16} y={CARD_A.y + 20} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={anatU}>
            internal/core.ts
          </text>
          <text x={CARD_A.x + CARD_A.w + 16} y={CARD_A.y + 38} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={anatU}>
            makePrimitive
          </text>
        </g>

        {/* card C — travels into the fiber slot at the end */}
        <g
          transform={`translate(${rootPos.x - (CARD_C.x + CARD_C.w / 2)} ${rootPos.y - (CARD_C.y + CARD_C.h / 2)}) `}
        >
          <g
            transform={`translate(${CARD_C.x + CARD_C.w / 2} ${CARD_C.y + CARD_C.h / 2}) scale(${rootScale}) translate(${-(CARD_C.x + CARD_C.w / 2)} ${-(CARD_C.y + CARD_C.h / 2)})`}
          >
            <InstrCard spec={SPEC_C} u={cardCU} />
          </g>
        </g>

        {/* the zero meter */}
        <g opacity={meterU * leftOp}>
          <text x={METER.x} y={METER.y} fill={colors.MUTED} fontSize={13}>
            instructions executed
          </text>
          <text x={METER.x} y={METER.y + 44} fill={meterPulse > 0 && meterPulse < 3 ? colors.WARM : colors.TEXT} fontSize={40} fontFamily={MONO} fontWeight={700}>
            0
          </text>
          {meterPulse > 0 && meterPulse < 3 && (
            <circle cx={METER.x + 14} cy={METER.y + 30} r={30 + 14 * (1 - pulse)} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={pulse * 0.8} />
          )}
        </g>

        {/* Effect.runFork chip */}
        <g opacity={forkU}>
          <rect x={FIBER.x} y={FIBER.y - 46} width={214} height={34} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
          <text x={FIBER.x + 107} y={FIBER.y - 24} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>
            Effect.runFork(program)
          </text>
        </g>

        {/* the fiber panel */}
        <g opacity={fiberU} transform={`translate(${(1 - fiberU) * 60} 0)`}>
          <rect x={FIBER.x} y={FIBER.y} width={FIBER.w} height={FIBER.h} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={FIBER.x + 20} y={FIBER.y + 30} fill={colors.TEXT} fontSize={16} fontWeight={700}>
            FiberImpl
          </text>
          <text x={FIBER.x + FIBER.w - 18} y={FIBER.y + 30} textAnchor="end" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            internal/effect.ts
          </text>
          {/* the current slot */}
          <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} rx={10} fill={colors.BG} stroke={colors.MUTED} strokeDasharray="5 5" />
          <text x={SLOT.x + SLOT.w / 2} y={SLOT.y - 8} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            current
          </text>
          {rootU < 0.02 && (
            <text x={SLOT.x + SLOT.w / 2} y={SLOT.y + SLOT.h / 2 + 5} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={0.6}>
              empty
            </text>
          )}
          {/* field rows */}
          {fiberRows.map(([label], i) => {
            const u = win(rowsU, fiberRows.length, i, 1.4);
            return (
              <g key={label} opacity={u}>
                <rect x={FIBER.x + 26} y={FIBER.y + 190 + i * 42} width={FIBER.w - 52} height={32} rx={8} fill={colors.BG} stroke={colors.GRID} />
                <text x={FIBER.x + 42} y={FIBER.y + 211 + i * 42} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  {label}
                </text>
              </g>
            );
          })}
        </g>

        <defs>
          <marker id="ch1-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.ACCENT} />
          </marker>
        </defs>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
