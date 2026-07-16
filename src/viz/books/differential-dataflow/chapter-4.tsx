// The Frontier
//
// Grounding: operators/arrange/mod.rs — the operator "responds to changes in
// its input frontier, which as it advances signals further times that will no
// longer be observed in input updates". arrangement.rs — readers interrogate
// the trace "only at times for which it knows the trace is complete, as
// indicated by the frontiers on its incoming channels"; implementations
// "commit only completed data". The coordination loop is examples/degrees.rs
// and compact.rs verbatim: input.advance_to(t); input.flush(); while
// probe.less_than(input.time()) { worker.step(); }. Partially ordered times
// (Product of round × loop counter) are iterate.rs / columnar operators.rs.
//
// Centerpiece: the TIME RIVER. Updates are molten dots on a time axis; the
// frontier is a wavefront sweeping right; dots behind it crystallize —
// committed, final, safe to act on. Held outputs commit the moment the wave
// passes their time. The finale re-forms time as a 2D lattice where the
// frontier becomes a STAIRCASE antichain — the shape iteration needs.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
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
// Layout + data (module scope, deterministic).
// ---------------------------------------------------------------------------

const AXIS_Y = 400;
const AXIS_X0 = 150;
const T_UNIT = 158; // px per logical time unit
const tx = (t: number) => AXIS_X0 + t * T_UNIT;

// updates on the river: {time, row} — row stacks dots above the axis
const DOTS: Array<{ t: number; row: number }> = [
  { t: 0.55, row: 0 },
  { t: 1.15, row: 1 },
  { t: 1.75, row: 0 },
  { t: 2.35, row: 1 },
  { t: 3.05, row: 0 },
  { t: 3.55, row: 1 },
];
const LATE_DOTS: Array<{ t: number; row: number }> = [
  { t: 4.35, row: 0 },
  { t: 4.9, row: 1 },
  { t: 5.45, row: 0 },
];
const dotY = (row: number) => AXIS_Y - 46 - row * 44;

// input handle + held-output pen
const INPUT = { x: 208, y: 158 };
const PEN = { x: 1064, y: 210 };
const HELD = [
  { t: 2, label: '(out, t=2, +1)' },
  { t: 3, label: '(out, t=3, −1)' },
];

// probe loop code (examples/degrees.rs, verbatim shape)
const PROBE_CODE = ['input.advance_to(t);', 'input.flush();', 'while probe.less_than(input.time())', '  { worker.step(); }'];

// 2D lattice (rounds × iterations)
const LAT = { x0: 470, y0: 150, dx: 100, dy: 82, n: 4 };
const latX = (r: number) => LAT.x0 + r * LAT.dx;
const latY = (i: number) => LAT.y0 + i * LAT.dy;

const CAM_RIVER: CameraState = { x: 640, y: 330, k: 1.06 };
const CAM_LATTICE: CameraState = { x: 660, y: 300, k: 1.12 };

// ---------------------------------------------------------------------------
// Timeline (~84s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RIVER, cameraInterp);
  const wob = tl.channel('wob', 0); // molten shimmer phase (pure fn of channel)
  tl.tween(wob, 22, { at: 0, dur: 84, ease: ease.linear });

  const axisU = tl.channel('axisU', 0);
  const dotsU = tl.channel('dotsU', 0);
  const outQU = tl.channel('outQU', 0); // the untrusted output + question
  const inputU = tl.channel('inputU', 0); // input handle node
  const promiseU = tl.channel('promiseU', 0); // advance_to(4) chip
  const front = tl.channel('front', -0.4); // frontier position, time units
  const frontU = tl.channel('frontU', 0); // wavefront visibility
  const penU = tl.channel('penU', 0); // held-output pen
  const probeU = tl.channel('probeU', 0); // probe code panel
  const lateU = tl.channel('lateU', 0); // late dots arrive
  const riverDim = tl.channel('riverDim', 0); // river fades for the lattice
  const latticeU = tl.channel('latticeU', 0);
  const stairU = tl.channel('stairU', 0); // staircase sweep (kf = stairU * 7)
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · an answer you cannot trust yet —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Chapter two ended with an output difference stamped time three. Here is the uncomfortable question: could another update for time three still be on its way?',
  });
  tl.tween(axisU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(dotsU, 1, { at: 1.6, dur: 2.2, ease: ease.enter });
  tl.tween(outQU, 1, { at: 3.4, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 7.6,
    dur: 5.0,
    text: 'Until you can rule that out, every update is molten — a number you can read but must not act on.',
  });

  // — beat 2 · the promise —
  tl.caption({
    at: 13.4,
    dur: 6.4,
    text: 'Certainty starts at the input. Calling advance to four is a promise: no update earlier than time four will ever arrive again.',
  });
  tl.tween(inputU, 1, { at: 13.6, dur: 0.8, ease: ease.enter });
  tl.tween(promiseU, 1, { at: 15.2, dur: 0.6, ease: ease.pop });

  // — beat 3 · the wavefront —
  tl.caption({
    at: 20.6,
    dur: 6.6,
    text: 'That promise is the frontier. It sweeps through the dataflow like a wavefront — and every time it passes crystallizes. Committed. Final.',
  });
  tl.tween(frontU, 1, { at: 21.0, dur: 0.5, ease: ease.enter });
  tl.tween(front, 4, { at: 21.6, dur: 4.6, ease: ease.move });

  // — beat 4 · held outputs commit —
  tl.caption({
    at: 28.2,
    dur: 6.8,
    text: 'Operators sit on their results until then. The counts for times two and three were held back — the moment no earlier input can exist, they commit downstream.',
  });
  tl.tween(penU, 1, { at: 28.6, dur: 0.8, ease: ease.enter });

  // — beat 5 · the probe —
  tl.caption({
    at: 35.8,
    dur: 7.0,
    text: 'And downstream, a probe answers one question: has the frontier passed this time yet? The caller just steps the worker until the answer is yes. That is the entire coordination protocol.',
  });
  tl.tween(probeU, 1, { at: 36.4, dur: 0.8, ease: ease.enter });

  // — beat 6 · commitment rolls forward —
  tl.caption({
    at: 43.6,
    dur: 5.8,
    text: 'New updates keep landing ahead of the wave. Nothing ever pauses — commitment simply rolls forward, one promised time after another.',
  });
  tl.tween(lateU, 1, { at: 44.0, dur: 1.8, ease: ease.enter });
  tl.tween(front, 6.1, { at: 45.6, dur: 3.4, ease: ease.move });

  // — beat 7 · time grows a second coordinate —
  tl.caption({
    at: 50.4,
    dur: 6.6,
    text: 'One wrinkle before the next chapter: inside a loop, a timestamp grows a second coordinate — the input round, and the loop iteration. Times are now only partially ordered.',
  });
  tl.tween(riverDim, 1, { at: 50.8, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_LATTICE, { at: 50.8, dur: 1.4, ease: ease.move });
  tl.tween(latticeU, 1, { at: 52.0, dur: 1.6, ease: ease.enter });

  // — beat 8 · the staircase —
  tl.caption({
    at: 57.8,
    dur: 7.0,
    text: 'So the frontier stops being one number and becomes a staircase — a set of incomparable times. Behind the staircase, history is settled. Ahead of it, still molten.',
  });
  tl.tween(stairU, 1, { at: 58.6, dur: 5.2, ease: ease.move });

  // — beat 9 · close —
  tl.caption({
    at: 65.8,
    dur: 7.2,
    text: 'This is what decides when output commits: the frontier tells every operator which part of history is finished — so you can trust an answer you never recomputed.',
  });
  tl.tween(latticeU, 0.22, { at: 66.0, dur: 0.9, ease: ease.move });
  tl.tween(closeU, 1, { at: 66.6, dur: 0.9, ease: ease.enter });
  tl.hold(72.8, 1.2);

  return {
    tl,
    cam,
    wob,
    axisU,
    dotsU,
    outQU,
    inputU,
    promiseU,
    front,
    frontU,
    penU,
    probeU,
    lateU,
    riverDim,
    latticeU,
    stairU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Dot({ t, row, wob, front, entered, idx }: { t: number; row: number; wob: number; front: number; entered: number; idx: number }) {
  if (entered <= 0.01) return null;
  const committed = clamp01((front - t) * 3);
  const wiggle = (1 - committed) * Math.sin(wob * Math.PI * 2 * 0.55 + idx * 1.7);
  const r = 8 + 1.4 * wiggle;
  const x = tx(t);
  const y = dotY(row) - (1 - entered) * 22;
  return (
    <g opacity={entered}>
      {committed > 0.05 && <circle cx={x} cy={y} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0.7 * committed} />}
      <circle cx={x} cy={y} r={r} fill={committed > 0.5 ? colors.POSITIVE : colors.WARM} opacity={0.55 + 0.45 * committed} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const wob = s.get(scene.wob);
  const axisU = s.get(scene.axisU);
  const dotsU = s.get(scene.dotsU);
  const outQU = s.get(scene.outQU);
  const inputU = s.get(scene.inputU);
  const promiseU = s.get(scene.promiseU);
  const front = s.get(scene.front);
  const frontU = s.get(scene.frontU);
  const penU = s.get(scene.penU);
  const probeU = s.get(scene.probeU);
  const lateU = s.get(scene.lateU);
  const riverDim = s.get(scene.riverDim);
  const latticeU = s.get(scene.latticeU);
  const stairU = s.get(scene.stairU);
  const closeU = s.get(scene.closeU);

  const riverOp = 1 - 0.88 * riverDim;
  const kf = stairU * 7; // staircase progress over the 4×4 lattice

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= THE TIME RIVER ================= */}
        <g opacity={riverOp}>
          {axisU > 0.01 && (
            <g>
              <line x1={AXIS_X0 - 30} y1={AXIS_Y} x2={AXIS_X0 + (1120 - AXIS_X0) * axisU} y2={AXIS_Y} stroke={colors.GRID} strokeWidth={2} />
              {[0, 1, 2, 3, 4, 5, 6].map((t) => (
                <g key={t} opacity={axisU}>
                  <line x1={tx(t)} y1={AXIS_Y - 5} x2={tx(t)} y2={AXIS_Y + 5} stroke={colors.GRID} strokeWidth={2} />
                  <text x={tx(t)} y={AXIS_Y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    t={t}
                  </text>
                </g>
              ))}
              <text x={1128} y={AXIS_Y + 26} textAnchor="start" fill={colors.MUTED} fontSize={13} fontStyle="italic" opacity={axisU}>
                time
              </text>
            </g>
          )}

          {DOTS.map((d, i) => (
            <Dot key={i} t={d.t} row={d.row} wob={wob} front={front} entered={win(dotsU, DOTS.length, i, 2)} idx={i} />
          ))}
          {LATE_DOTS.map((d, i) => (
            <Dot key={`l${i}`} t={d.t} row={d.row} wob={wob} front={front} entered={win(lateU, LATE_DOTS.length, i, 1.6)} idx={i + 7} />
          ))}

          {/* the questioned output */}
          {outQU > 0.01 && (
            <g opacity={outQU * (1 - clamp01((front - 3) * 2))}>
              <rect x={tx(3) - 76} y={AXIS_Y - 152} width={152} height={32} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={tx(3)} y={AXIS_Y - 131} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
                (out, t=3, +1) ?
              </text>
              <text x={tx(3) + 92} y={AXIS_Y - 128} fill={colors.NEGATIVE} fontSize={18} fontWeight={700}>
                ?
              </text>
            </g>
          )}

          {/* input handle + the promise */}
          {inputU > 0.01 && (
            <g opacity={inputU}>
              <rect x={INPUT.x - 78} y={INPUT.y - 26} width={156} height={52} rx={11} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
              <text x={INPUT.x} y={INPUT.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
                input handle
              </text>
              <text x={INPUT.x} y={INPUT.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                InputHandle
              </text>
              {promiseU > 0.01 && (
                <g opacity={promiseU}>
                  <rect x={INPUT.x - 84} y={INPUT.y + 40} width={168} height={32} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
                  <text x={INPUT.x} y={INPUT.y + 61} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                    advance_to(4)
                  </text>
                  <path d={`M${INPUT.x + 86} ${INPUT.y + 56} C ${tx(1)} ${INPUT.y + 80}, ${tx(1.4)} ${AXIS_Y - 130}, ${tx(front < 4 ? front : 4)} ${AXIS_Y - 110}`} fill="none" stroke={colors.WARM} strokeWidth={1.4} strokeDasharray="3 5" opacity={0.6 * frontU} />
                </g>
              )}
            </g>
          )}

          {/* the wavefront */}
          {frontU > 0.01 && (
            <g opacity={frontU}>
              <rect x={tx(front) - 130} y={AXIS_Y - 190} width={130} height={220} fill="url(#dd4-settled)" opacity={0.5} />
              <line x1={tx(front)} y1={AXIS_Y - 190} x2={tx(front)} y2={AXIS_Y + 30} stroke={colors.WARM} strokeWidth={3} />
              <text x={tx(front)} y={AXIS_Y - 200} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
                frontier
              </text>
            </g>
          )}

          {/* held-output pen */}
          {penU > 0.01 && (
            <g opacity={penU}>
              <rect x={PEN.x - 96} y={PEN.y - 34} width={192} height={104} rx={11} fill={colors.PANEL} stroke={colors.GRID} strokeDasharray="6 5" />
              <text x={PEN.x} y={PEN.y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontStyle="italic">
                held until complete
              </text>
              {HELD.map((h, i) => {
                const done = clamp01((front - h.t) * 3);
                return (
                  <g key={i}>
                    <rect x={PEN.x - 80} y={PEN.y + i * 34} width={160} height={26} rx={7} fill={colors.BG} stroke={done > 0.5 ? colors.POSITIVE : colors.WARM} strokeWidth={1.4} />
                    <text x={PEN.x - 6} y={PEN.y + 17 + i * 34} textAnchor="middle" fill={done > 0.5 ? colors.POSITIVE : colors.WARM} fontSize={12} fontFamily={MONO}>
                      {h.label}
                    </text>
                    {done > 0.5 && (
                      <text x={PEN.x + 66} y={PEN.y + 17 + i * 34} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={700}>
                        ✓
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* probe code */}
          {probeU > 0.01 && (
            <g opacity={probeU}>
              <rect x={438} y={480} width={404} height={104} rx={11} fill={colors.PANEL} stroke={colors.GRID} />
              {PROBE_CODE.map((line, i) => (
                <text key={i} x={458} y={504 + i * 19} fill={i >= 2 ? colors.ACCENT : colors.TEXT} fontSize={13} fontFamily={MONO}>
                  {line}
                </text>
              ))}
              <text x={862} y={508} fill={front >= 4 ? colors.POSITIVE : colors.WARM} fontSize={13} fontFamily={MONO} opacity={probeU}>
                {front >= 4 ? '→ complete ✓' : '→ stepping…'}
              </text>
            </g>
          )}
        </g>

        {/* ================= THE 2D LATTICE ================= */}
        {latticeU > 0.01 && (
          <g opacity={latticeU}>
            <text x={latX(1.5)} y={LAT.y0 - 62} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
              time as a pair
            </text>
            <MathLabel tex={'(\\text{round}, \\text{iteration})'} x={latX(1.5) - 78} y={LAT.y0 - 48} fontSize={15} color={colors.MUTED} opacity={latticeU} />
            {Array.from({ length: LAT.n }, (_, r) =>
              Array.from({ length: LAT.n }, (_, i) => {
                const done = clamp01((kf - (r + i)) * 1.6);
                const onFront = Math.abs(r + i + 0.5 - kf) < 0.75 ? 1 : 0;
                return (
                  <g key={`${r}-${i}`}>
                    <circle
                      cx={latX(r)}
                      cy={latY(i)}
                      r={11}
                      fill={done > 0.5 ? colors.POSITIVE : colors.WARM}
                      opacity={0.3 + 0.55 * done + 0.3 * onFront}
                    />
                    <text x={latX(r)} y={latY(i) + 30} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={0.75}>
                      ({r},{i})
                    </text>
                  </g>
                );
              }),
            )}
            {/* the staircase line: boundary of { (r, i) : r + i < kf } */}
            {stairU > 0.02 && (
              <path
                d={(() => {
                  const cl = (v: number) => Math.max(0, Math.min(LAT.n, v));
                  const bx = (i: number) => latX(0) - LAT.dx / 2 + cl(kf - i) * LAT.dx;
                  let d = `M${bx(0).toFixed(1)} ${(latY(0) - LAT.dy / 2).toFixed(1)}`;
                  for (let i = 0; i < LAT.n; i++) {
                    d += `L${bx(i).toFixed(1)} ${(latY(i) + LAT.dy / 2).toFixed(1)}`;
                    if (i + 1 < LAT.n) d += `L${bx(i + 1).toFixed(1)} ${(latY(i) + LAT.dy / 2).toFixed(1)}`;
                  }
                  return d;
                })()}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2.5}
                strokeDasharray="7 5"
                opacity={0.9}
              />
            )}
            <text x={latX(0) - 10} y={latY(0) - 34} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              settled
            </text>
            <text x={latX(LAT.n - 1) + 14} y={latY(LAT.n - 1) + 52} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontStyle="italic">
              still molten
            </text>
            <text x={latX(1.5)} y={latY(LAT.n - 1) + 88} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              frontier = Antichain of incomparable times
            </text>
          </g>
        )}

        {/* ---------------- closing panel ---------------- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={280} y={470} width={720} height={130} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={520} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={650}>
              The frontier decides when output commits.
            </text>
            <text x={640} y={558} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
              behind it, history is sealed — trust without recomputing
            </text>
          </g>
        )}
      </Camera>
      <defs>
        <linearGradient id="dd4-settled" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={colors.POSITIVE} stopOpacity="0" />
          <stop offset="1" stopColor={colors.POSITIVE} stopOpacity="0.28" />
        </linearGradient>
      </defs>
    </>
  );
}

export const vizScene = () => scene;
