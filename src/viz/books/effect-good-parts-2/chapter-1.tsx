// The Second Track
//
// Grounding: ai-docs/src/01_effect/04_errors/01_error-handling.ts —
// ParseError / ReservedPortError via Schema.TaggedErrorClass, loadPort(input)
// returning Effect<number, ParseError | ReservedPortError>, recovery with
// Effect.catchTag("ReservedPortError", …) and the array form
// Effect.catchTag(["ParseError", "ReservedPortError"], () => Effect.succeed(3000)).
//
// Centerpiece: a two-rail railway (success rail / error rail) under a LIVE
// type signature. The E slot of Effect<A, E, R> accumulates tag chips as
// failure modes appear; a catchTag station on the error rail lifts a matching
// error back to the success rail carrying the fallback 3000; handling both
// tags drains E to `never` and the error rail itself fades away.
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the live signature chip (top) and the two-rail railway (below).
// ---------------------------------------------------------------------------

const SIG = { x: 240, y: 84, w: 800, h: 66 } as const;
const SIG_CY = SIG.y + SIG.h / 2;

// chips inside the signature: Effect< [number], [ParseError][ReservedPortError], [never] >
const CHIP_A = { x: 366, w: 96 } as const;
const CHIP_E1 = { x: 486, w: 100 } as const; // ParseError
const CHIP_E2 = { x: 594, w: 142 } as const; // ReservedPortError
const CHIP_EN = { x: 486, w: 76 } as const; // never (after both are caught)
const CHIP_R = { x: 764, w: 76 } as const; // never (dim — later chapters)

const RAIL_X0 = 120;
const RAIL_X1 = 1160;
const RAIL_OK = 410; // success rail y
const RAIL_ERR = 530; // error rail y

const CARD = { x: 390, y: 252, w: 500, h: 96 } as const; // the plain-function card

const DEF1 = { x: 300, y: 196, w: 290, h: 118 } as const; // ParseError card
const DEF2 = { x: 690, y: 196, w: 290, h: 118 } as const; // ReservedPortError card

const ST_LOAD = { cx: 330, w: 168, h: 54 } as const; // loadPort station on the rail
const ST_CATCH = { cx: 760, w: 236, h: 62 } as const; // catchTag station under the rail
const SWITCH_X = 470; // where the run diverges to the error rail
const TERM_X = 1092; // terminal socket on the success rail

// exception bolt — a zigzag that escapes the frame (beat 2)
const BOLT_PTS: ReadonlyArray<readonly [number, number]> = [
  [758, 258],
  [806, 214],
  [780, 196],
  [846, 140],
  [820, 124],
  [896, 62],
];
const BOLT_D = BOLT_PTS.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('');

// camera marks
const CAM_CARD: CameraState = { x: 640, y: 296, k: 1.32 };
const CAM_DEFS: CameraState = { x: 640, y: 262, k: 1.16 };
const CAM_RAIL: CameraState = { x: 626, y: 462, k: 1.26 };
const CAM_CATCH: CameraState = { x: 770, y: 476, k: 1.42 };
const CAM_CHIP: CameraState = { x: 640, y: 170, k: 1.42 };

// ---------------------------------------------------------------------------
// Timeline (~65s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CARD, cameraInterp);

  const cardU = tl.channel('cardU', 0); // plain function card
  const boltU = tl.channel('boltU', 0); // 0..1 draw the bolt, 1..2 it flies off
  const sigU = tl.channel('sigU', 0); // card → live signature chip
  const railsU = tl.channel('railsU', 0); // the two rails draw on
  const defsU = tl.channel('defsU', 0); // tagged-error definition cards
  const runU = tl.channel('runU', 0); // packet: enter → loadPort → switch
  const divU = tl.channel('divU', 0); // diverge: drop to the error rail + roll
  const stationU = tl.channel('stationU', 0); // catchTag station appears
  const matchU = tl.channel('matchU', 0); // 0..0.3 scan, 0.3..1 lift + morph
  const keyU = tl.channel('keyU', 0); // key plate swaps to the array form
  const neverU = tl.channel('neverU', 0); // E slot drains to `never`
  const fadeU = tl.channel('fadeU', 0); // error rail + stations fade away
  const cruiseU = tl.channel('cruiseU', 0); // the rescued value cruises home
  const teaseU = tl.channel('teaseU', 0); // capsule-in-capsule teaser

  // — beat 1 · a promise in the type —
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Every function makes a promise in its type. This parser promises to turn a string into a port number.',
  });
  tl.tween(cardU, 1, { at: 0.7, dur: 0.7, ease: ease.enter });

  // — beat 2 · the invisible exception —
  tl.caption({
    at: 6.2,
    dur: 6.0,
    text: 'But feed it something bad and an exception flies out sideways. Nothing in the signature warned you, and nothing in the type system will catch it.',
  });
  tl.tween(boltU, 1, { at: 6.6, dur: 1.0, ease: ease.draw });
  tl.tween(boltU, 2, { at: 7.9, dur: 1.0, ease: ease.move });

  // — beat 3 · failure enters the type —
  tl.caption({
    at: 12.8,
    dur: 7.2,
    text: 'Effect writes failure into the promise itself. This program succeeds with a number, or fails with one of two named errors. The second slot of the type is the error channel.',
  });
  tl.tween(sigU, 1, { at: 13.2, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 13.3, dur: 1.3, ease: ease.move });
  tl.tween(railsU, 1, { at: 15.6, dur: 1.5, ease: ease.draw });

  // — beat 4 · errors are values —
  tl.caption({
    at: 20.6,
    dur: 7.0,
    text: 'The errors are ordinary values, defined as tagged classes. Each carries a tag naming what went wrong, and real data: the input that failed to parse, the port that was reserved.',
  });
  tl.tween(cam, CAM_DEFS, { at: 20.8, dur: 1.2, ease: ease.move });
  tl.tween(defsU, 1, { at: 21.2, dur: 1.4, ease: ease.enter });

  // — beat 5 · run it: the run diverges —
  tl.caption({
    at: 28.2,
    dur: 6.6,
    text: 'Run it with port eighty, a reserved port. The result drops onto the error track as a value. No throw, no stack unwinding. Failure is just cargo on a different rail.',
  });
  tl.tween(cam, CAM_RAIL, { at: 28.4, dur: 1.3, ease: ease.move });
  tl.tween(runU, 1, { at: 29.0, dur: 2.2, ease: ease.linear });
  tl.tween(divU, 1, { at: 31.3, dur: 2.4, ease: ease.linear });

  // — beat 6 · the catchTag station —
  tl.caption({
    at: 35.4,
    dur: 7.4,
    text: 'Recovery is a station on that rail. Catch tag watches for one tag; when the reserved port error rolls in, its handler lifts the program back to success with a default port of three thousand.',
  });
  tl.tween(cam, CAM_CATCH, { at: 35.5, dur: 1.3, ease: ease.move });
  tl.tween(stationU, 1, { at: 35.9, dur: 0.6, ease: ease.pop });
  tl.tween(matchU, 1, { at: 37.2, dur: 2.8, ease: ease.move });

  // — beat 7 · the array form drains E —
  tl.caption({
    at: 43.6,
    dur: 7.0,
    text: 'Catch tag also accepts a list of tags. Handle both at once and watch the signature: the error slot drains to never. The compiler now knows this program cannot fail.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.8, dur: 1.3, ease: ease.move });
  tl.tween(keyU, 1, { at: 44.4, dur: 0.8, ease: ease.move });
  tl.tween(neverU, 1, { at: 46.4, dur: 0.9, ease: ease.pop });

  // — beat 8 · the error rail fades —
  tl.caption({
    at: 51.2,
    dur: 6.4,
    text: 'That is the whole trade. Failures stop being surprises buried in control flow and become entries in a type: visible, catchable, and provably gone once handled.',
  });
  tl.tween(fadeU, 1, { at: 51.6, dur: 1.4, ease: ease.move });
  tl.tween(cruiseU, 1, { at: 52.2, dur: 2.4, ease: ease.linear });

  // — beat 9 · teaser: errors nest —
  tl.caption({
    at: 58.2,
    dur: 6.2,
    text: 'One wrinkle, though. Real systems fail in families, one error wrapping a deeper reason inside. Cracking those open cleanly is where we go next.',
  });
  tl.tween(cam, CAM_CHIP, { at: 58.6, dur: 1.5, ease: ease.move });
  tl.tween(teaseU, 1, { at: 59.8, dur: 0.8, ease: ease.pop });
  tl.hold(64.4, 1.2);

  return {
    tl,
    cam,
    cardU,
    boltU,
    sigU,
    railsU,
    defsU,
    runU,
    divU,
    stationU,
    matchU,
    keyU,
    neverU,
    fadeU,
    cruiseU,
    teaseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function Chip({
  x,
  w,
  label,
  color,
  opacity,
  cy = SIG_CY,
  h = 30,
  fs = 13,
}: {
  x: number;
  w: number;
  label: string;
  color: string;
  opacity: number;
  cy?: number;
  h?: number;
  fs?: number;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={cy - h / 2} width={w} height={h} rx={7} fill={colors.BG} stroke={color} strokeWidth={1.5} />
      <text x={x + w / 2} y={cy + fs * 0.36} textAnchor="middle" fill={color} fontSize={fs} fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

function DefCard({
  box,
  tag,
  fields,
  u,
  dim,
}: {
  box: { x: number; y: number; w: number; h: number };
  tag: string;
  fields: string[];
  u: number;
  dim: number;
}) {
  if (u <= 0.01) return null;
  const rise = 18 * (1 - u);
  return (
    <g opacity={u * (1 - 0.9 * dim)} transform={`translate(0 ${rise})`}>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
      <rect x={box.x + 16} y={box.y + 14} width={12 + tag.length * 7.6} height={24} rx={6} fill={colors.NEGATIVE} opacity={0.16} />
      <text x={box.x + 22} y={box.y + 31} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} fontWeight={600}>
        {tag}
      </text>
      {fields.map((f, i) => (
        <text key={f} x={box.x + 22} y={box.y + 58 + i * 20} fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
          {f}
        </text>
      ))}
      <text x={box.x + 22} y={box.y + box.h - 12} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        Schema.TaggedErrorClass
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cardU = s.get(scene.cardU);
  const boltU = s.get(scene.boltU);
  const sigU = s.get(scene.sigU);
  const railsU = s.get(scene.railsU);
  const defsU = s.get(scene.defsU);
  const runU = s.get(scene.runU);
  const divU = s.get(scene.divU);
  const stationU = s.get(scene.stationU);
  const matchU = s.get(scene.matchU);
  const keyU = s.get(scene.keyU);
  const neverU = s.get(scene.neverU);
  const fadeU = s.get(scene.fadeU);
  const cruiseU = s.get(scene.cruiseU);
  const teaseU = s.get(scene.teaseU);

  const cardOp = cardU * (1 - sigU);
  const errDim = fadeU; // error-rail layer fade (→ ≤ 0.1)
  const defsDim = clamp01(keyU + fadeU);

  // — the running packet —
  // runU: 140 → loadPort (dwell) → switch. divU: drop to error rail, roll to station.
  let px = 140 + (ST_LOAD.cx - 140) * clamp01(runU / 0.42);
  if (runU > 0.55) px = ST_LOAD.cx + (SWITCH_X - ST_LOAD.cx) * clamp01((runU - 0.55) / 0.45);
  let py = RAIL_OK;
  let asError = false;
  if (divU > 0.001) {
    const drop = clamp01(divU / 0.45);
    const roll = clamp01((divU - 0.45) / 0.55);
    asError = true;
    px = SWITCH_X + 70 * drop + (ST_CATCH.cx - SWITCH_X - 70) * roll;
    py = RAIL_OK + (RAIL_ERR - RAIL_OK) * drop;
  }
  // matchU lift: capsule → "3000" chip rising back to the success rail
  const lift = clamp01((matchU - 0.3) / 0.7);
  if (lift > 0) {
    px = ST_CATCH.cx;
    py = RAIL_ERR + (RAIL_OK - RAIL_ERR) * lift;
  }
  if (cruiseU > 0.001) px = ST_CATCH.cx + (TERM_X - ST_CATCH.cx) * cruiseU;
  const morphed = lift > 0.55; // capsule has become the 3000 value chip
  const capW = lerp(158, 86, clamp01((lift - 0.35) / 0.4));
  const scanPulse = clamp01(matchU / 0.3);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- beat 1–2: the plain function + escaping bolt ---------------- */}
        {cardOp > 0.01 && (
          <g opacity={cardOp}>
            <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={CARD.y + 42} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={MONO}>
              function loadPort(input: string): number
            </text>
            <text x={640} y={CARD.y + 72} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontStyle="italic">
              …and not a word about how it fails
            </text>
          </g>
        )}
        {boltU > 0.01 && boltU < 1.98 && (
          <g
            opacity={cardOp * (boltU <= 1 ? 1 : 1 - clamp01(boltU - 1))}
            transform={boltU > 1 ? `translate(${(boltU - 1) * 260} ${-(boltU - 1) * 220})` : undefined}
          >
            <path
              d={BOLT_D}
              fill="none"
              stroke={colors.NEGATIVE}
              strokeWidth={3.5}
              strokeLinejoin="miter"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - clamp01(boltU)}
            />
            <text x={BOLT_PTS[5][0] + 10} y={BOLT_PTS[5][1] - 6} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} opacity={clamp01(boltU * 2 - 1.2)}>
              throw
            </text>
          </g>
        )}

        {/* ---------------- the live signature chip ---------------- */}
        {sigU > 0.01 && (
          <g opacity={sigU}>
            <rect x={SIG.x} y={SIG.y} width={SIG.w} height={SIG.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={280} y={SIG_CY + 6} fill={colors.TEXT} fontSize={19} fontFamily={MONO}>
              Effect&lt;
            </text>
            <Chip x={CHIP_A.x} w={CHIP_A.w} label="number" color={colors.POSITIVE} opacity={1} />
            <text x={CHIP_A.x + CHIP_A.w + 6} y={SIG_CY + 6} fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
              ,
            </text>
            {/* E slot: two tags → never */}
            <Chip x={CHIP_E1.x} w={CHIP_E1.w} label="ParseError" color={colors.NEGATIVE} opacity={(1 - neverU) * clamp01(sigU * 2 - 0.4)} />
            <Chip x={CHIP_E2.x} w={CHIP_E2.w} label="ReservedPortError" color={colors.NEGATIVE} opacity={(1 - neverU) * clamp01(sigU * 2 - 0.8)} fs={12} />
            {(1 - neverU) > 0.02 && (
              <text x={CHIP_E1.x + CHIP_E1.w + 4} y={SIG_CY + 5} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO} opacity={1 - neverU}>
                |
              </text>
            )}
            <Chip x={CHIP_EN.x} w={CHIP_EN.w} label="never" color={colors.MUTED} opacity={neverU} />
            <text x={CHIP_E2.x + CHIP_E2.w + 8} y={SIG_CY + 6} fill={colors.MUTED} fontSize={16} fontFamily={MONO}>
              ,
            </text>
            <Chip x={CHIP_R.x} w={CHIP_R.w} label="never" color={colors.ACCENT} opacity={0.38} />
            <text x={CHIP_R.x + CHIP_R.w + 10} y={SIG_CY + 6} fill={colors.TEXT} fontSize={19} fontFamily={MONO}>
              &gt;
            </text>
            {/* slot legend */}
            <text x={CHIP_A.x + CHIP_A.w / 2} y={SIG.y + SIG.h + 18} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
              A · success
            </text>
            <text x={(CHIP_E1.x + CHIP_E2.x + CHIP_E2.w) / 2} y={SIG.y + SIG.h + 18} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5}>
              E · error
            </text>
            <text x={CHIP_R.x + CHIP_R.w / 2} y={SIG.y + SIG.h + 18} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} opacity={0.55}>
              R · requirements
            </text>
            {/* teaser: an error wrapping a deeper reason */}
            {teaseU > 0.01 && (
              <g opacity={teaseU} transform={`translate(${SIG.x + SIG.w + 26} ${SIG_CY})`}>
                <circle r={30 + 4 * Math.sin(Math.PI * clamp01(teaseU))} fill={colors.NEGATIVE} opacity={0.12} />
                <rect x={-26} y={-15} width={52} height={30} rx={9} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.5} />
                <rect x={-13} y={-7} width={26} height={14} rx={5} fill={colors.NEGATIVE} opacity={0.55} />
              </g>
            )}
          </g>
        )}

        {/* ---------------- the two rails ---------------- */}
        {railsU > 0.01 && (
          <g>
            {/* success rail */}
            <line x1={RAIL_X0} y1={RAIL_OK} x2={RAIL_X0 + (RAIL_X1 - RAIL_X0) * railsU} y2={RAIL_OK} stroke={colors.POSITIVE} strokeWidth={2.5} opacity={0.8} />
            <text x={RAIL_X0} y={RAIL_OK - 14} fill={colors.POSITIVE} fontSize={12.5} opacity={railsU}>
              success
            </text>
            {/* error rail */}
            <g opacity={1 - 0.92 * errDim}>
              <line x1={RAIL_X0} y1={RAIL_ERR} x2={RAIL_X0 + (RAIL_X1 - RAIL_X0) * railsU} y2={RAIL_ERR} stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={0.7} />
              <text x={RAIL_X0} y={RAIL_ERR - 14} fill={colors.NEGATIVE} fontSize={12.5} opacity={railsU}>
                error
              </text>
              {/* the switch */}
              <line x1={SWITCH_X} y1={RAIL_OK} x2={SWITCH_X + 70} y2={RAIL_ERR} stroke={colors.GRID} strokeWidth={2} strokeDasharray="5 5" opacity={railsU * 0.9} />
            </g>
            {/* loadPort station */}
            <g opacity={railsU * (1 - 0.55 * fadeU)}>
              <rect x={ST_LOAD.cx - ST_LOAD.w / 2} y={RAIL_OK - ST_LOAD.h / 2} width={ST_LOAD.w} height={ST_LOAD.h} rx={11} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={ST_LOAD.cx} y={RAIL_OK + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                loadPort(input)
              </text>
            </g>
            {/* terminal socket */}
            <g opacity={clamp01(fadeU * 2)}>
              <circle cx={TERM_X} cy={RAIL_OK} r={15} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              {cruiseU > 0.9 && (
                <circle cx={TERM_X} cy={RAIL_OK} r={15 + 14 * clamp01((cruiseU - 0.9) * 10)} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={1 - clamp01((cruiseU - 0.9) * 10)} />
              )}
            </g>
          </g>
        )}

        {/* ---------------- tagged-error definition cards ---------------- */}
        <DefCard box={DEF1} tag="ParseError" fields={['input: string', 'message: string']} u={defsU} dim={defsDim} />
        <DefCard box={DEF2} tag="ReservedPortError" fields={['port: number']} u={clamp01(defsU * 1.3 - 0.3)} dim={defsDim} />

        {/* ---------------- catchTag station ---------------- */}
        {stationU > 0.01 && (
          <g opacity={stationU * (1 - 0.9 * errDim)}>
            <rect x={ST_CATCH.cx - ST_CATCH.w / 2} y={RAIL_ERR + 24} width={ST_CATCH.w} height={ST_CATCH.h} rx={11} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={ST_CATCH.cx} y={RAIL_ERR + 48} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
              Effect.catchTag
            </text>
            {/* the key plate: one tag → the array form */}
            <g>
              <text x={ST_CATCH.cx} y={RAIL_ERR + 70} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily={MONO} opacity={1 - keyU}>
                &quot;ReservedPortError&quot;
              </text>
              <text x={ST_CATCH.cx} y={RAIL_ERR + 70} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO} opacity={keyU}>
                [&quot;ParseError&quot;, &quot;ReservedPortError&quot;]
              </text>
            </g>
            {/* scanner arch over the rail */}
            <path
              d={`M${ST_CATCH.cx - 44} ${RAIL_ERR + 20} v-52 a10 10 0 0 1 10 -10 h68 a10 10 0 0 1 10 10 v52`}
              fill="none"
              stroke={scanPulse > 0.02 && matchU < 1 ? colors.POSITIVE : colors.GRID}
              strokeWidth={2}
              opacity={0.9}
            />
            {scanPulse > 0.02 && scanPulse < 1 && (
              <circle cx={ST_CATCH.cx} cy={RAIL_ERR} r={30 * scanPulse} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={1 - scanPulse} />
            )}
            {/* the lift path back to success */}
            {lift > 0.02 && (
              <line x1={ST_CATCH.cx} y1={RAIL_ERR} x2={ST_CATCH.cx} y2={RAIL_ERR + (RAIL_OK - RAIL_ERR) * lift} stroke={colors.POSITIVE} strokeWidth={2} strokeDasharray="2 6" />
            )}
          </g>
        )}

        {/* ---------------- the traveling run ---------------- */}
        {runU > 0.01 && cruiseU < 0.995 && (
          <g opacity={1}>
            {!asError ? (
              <g>
                <circle cx={px} cy={py} r={9} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={1.5} />
                <text x={px} y={py - 16} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  &quot;80&quot;
                </text>
              </g>
            ) : (
              <g>
                <rect
                  x={px - capW / 2}
                  y={py - 20}
                  width={capW}
                  height={40}
                  rx={12}
                  fill={colors.BG}
                  stroke={morphed ? colors.POSITIVE : colors.NEGATIVE}
                  strokeWidth={2}
                />
                {!morphed ? (
                  <g>
                    <text x={px} y={py - 2} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
                      ReservedPortError
                    </text>
                    <text x={px} y={py + 13} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                      port: 80
                    </text>
                  </g>
                ) : (
                  <text x={px} y={py + 5} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>
                    3000
                  </text>
                )}
              </g>
            )}
          </g>
        )}
        {cruiseU >= 0.995 && (
          <text x={TERM_X} y={RAIL_OK - 26} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
            3000
          </text>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
