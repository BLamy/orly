// Failure With a Plan
//
// Grounding: packages/effect/src/Schedule.ts — "A Schedule<Output, Input,
// Error, Env> is stepped with an input value. Each step either stops or
// produces an output together with the delay before the next step";
// Schedule.exponential(base, factor = 2) — delay = base · factor^(attempt−1);
// Schedule.jittered — "Each recurrence delay is scaled by a random factor
// between 0.8 and 1.2"; Effect.retry accepts Retry.Options { schedule, times,
// while, until } (packages/effect/src/Effect.ts), and "the source effect is
// always evaluated once before any retry policy is applied".
//
// Centerpiece: the DELAY STAIRCASE and the THUNDERING HERD. One client's
// exponential backoff builds a staircase of waits; then twenty-four clients
// retry on the same schedule and their synchronized pulses stack into load
// spikes on a histogram — until Schedule.jittered smears the waves flat.
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
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The schedule, computed for real: exponential("100 millis"), factor 2.
// ---------------------------------------------------------------------------

const BASE_DELAYS = [100, 200, 400, 800]; // ms between the 5 attempts
const SYNC_TIMES = BASE_DELAYS.reduce<number[]>((acc, d) => [...acc, acc[acc.length - 1] + d], [0]);
// [0, 100, 300, 700, 1500]

const N_CLIENTS = 24;
const rand = mulberry32(1729);
/** jittered cumulative attempt times per client: delay × random(0.8..1.2) */
const JIT_TIMES: number[][] = Array.from({ length: N_CLIENTS }, () => {
  const ts = [0];
  for (const d of BASE_DELAYS) ts.push(ts[ts.length - 1] + d * (0.8 + 0.4 * rand()));
  return ts;
});

const T_MAX = 1800; // ms shown
const AXIS_X0 = 170;
const AXIS_X1 = 1150;
const tx = (ms: number) => AXIS_X0 + (ms / T_MAX) * (AXIS_X1 - AXIS_X0);

// load histogram: 50ms bins, arrivals per bin, sync vs jittered
const BIN_MS = 50;
const N_BINS = T_MAX / BIN_MS;
function loadBins(times: number[][]): number[] {
  const bins = new Array<number>(N_BINS).fill(0);
  for (const ts of times) for (const t of ts) bins[Math.min(N_BINS - 1, Math.floor(t / BIN_MS))]++;
  return bins;
}
const SYNC_BINS = loadBins(Array.from({ length: N_CLIENTS }, () => SYNC_TIMES));
const JIT_BINS = loadBins(JIT_TIMES);

// layouts
const SOLO_Y = 430; // single-client axis (phase A)
const STAIR_BASE = SOLO_Y - 26;
const STAIR_H = (d: number) => d * 0.27; // 27, 54, 108, 216
const HERD_Y0 = 158; // herd rows (phase B)
const HERD_Y1 = 428;
const rowY = (i: number) => HERD_Y0 + (i * (HERD_Y1 - HERD_Y0)) / (N_CLIENTS - 1);
const HIST_BASE = 596;
const HIST_HMAX = 112; // sync peak = 24 arrivals

const CAM_STAIR: CameraState = { x: 560, y: 360, k: 1.22 };
const CAM_HIST: CameraState = { x: 640, y: 430, k: 1.18 };

// ---------------------------------------------------------------------------
// Timeline (~68s, 11 beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const axisU = tl.channel('axisU', 0); // solo axis
  const stepLblU = tl.channel('stepLblU', 0); // "step → delay | stop"
  const pulseU = tl.channel('pulseU', 0); // solo attempts appear
  const stairU = tl.channel('stairU', 0); // staircase bars
  const mathU = tl.channel('mathU', 0); // formula
  const soloOutU = tl.channel('soloOutU', 0); // phase A exits
  const herdU = tl.channel('herdU', 0); // 24 rows stagger in
  const histU = tl.channel('histU', 0); // histogram bars rise
  const jitLblU = tl.channel('jitLblU', 0); // Schedule.jittered chip
  const jitterU = tl.channel('jitterU', 0); // sync → jittered blend
  const herdOutU = tl.channel('herdOutU', 0); // herd dims for phase C
  const capU = tl.channel('capU', 0); // times: 5 budget wall
  const ourU = tl.channel('ourU', 0); // our request: fail fail success
  const recapU = tl.channel('recapU', 0);

  // — beat 1 · failure is weather —
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Our request just failed. In production, failure is weather, not news — the dependency is briefly sick, the network blinked. The question is when to try again.',
  });
  tl.tween(axisU, 1, { at: 0.7, dur: 1.1, ease: ease.draw });

  // — beat 2 · a schedule is stepped —
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Effect answers with a schedule: a policy that is stepped after each failure, and either stops — or says how long to wait before the next attempt.',
  });
  tl.tween(stepLblU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.tween(pulseU, 0.45, { at: 8.2, dur: 3.6, ease: ease.linear });

  // — beat 3 · the staircase —
  tl.caption({
    at: 13.0,
    dur: 5.4,
    text: 'Retry with an exponential schedule, and the waits form a staircase: one hundred milliseconds, then two hundred, then four hundred — doubling every attempt.',
  });
  tl.tween(cam, CAM_STAIR, { at: 13.2, dur: 1.4, ease: ease.move });
  tl.tween(pulseU, 1, { at: 13.4, dur: 3.6, ease: ease.linear });
  tl.tween(stairU, 1, { at: 13.6, dur: 4.0, ease: ease.linear });
  tl.tween(mathU, 1, { at: 16.4, dur: 0.8, ease: ease.enter });

  // — beat 4 · mercy —
  tl.caption({
    at: 18.9,
    dur: 5.0,
    text: 'The point of backing off is mercy: each failure buys the struggling service more room to recover.',
  });
  tl.hold(23.4, 0.5);

  // — beat 5 · you are not one client —
  tl.caption({
    at: 24.4,
    dur: 5.8,
    text: "But exponential backoff has a famous trap. You don't run one client — you run twenty-four, and they all failed at the same moment.",
  });
  tl.tween(soloOutU, 1, { at: 24.6, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 24.6, dur: 1.3, ease: ease.move });
  tl.tween(herdU, 1, { at: 25.4, dur: 3.6, ease: ease.linear });

  // — beat 6 · the battering ram —
  tl.caption({
    at: 30.6,
    dur: 5.8,
    text: 'Same schedule, same delays, same clocks. Every retry lands together, in waves — those load spikes are your retries. You have built a battering ram.',
  });
  tl.tween(cam, CAM_HIST, { at: 30.8, dur: 1.3, ease: ease.move });
  tl.tween(histU, 1, { at: 31.2, dur: 2.6, ease: ease.linear });

  // — beat 7 · jittered —
  tl.caption({
    at: 36.8,
    dur: 5.4,
    text: 'One combinator fixes it. Jittered scales every delay by a random factor between point eight and one point two.',
  });
  tl.tween(jitLblU, 1, { at: 37.4, dur: 0.7, ease: ease.enter });

  // — beat 8 · the drizzle —
  tl.caption({
    at: 42.6,
    dur: 5.6,
    text: 'The waves smear out, the spikes flatten, and the dependency sees a gentle drizzle instead of a synchronized flood.',
  });
  tl.tween(jitterU, 1, { at: 43.0, dur: 3.2, ease: ease.move });

  // — beat 9 · the budget —
  tl.caption({
    at: 48.6,
    dur: 5.4,
    text: 'Retries also need a budget. Cap the policy at five attempts, and when the budget is spent, the real error finally surfaces to be handled.',
  });
  tl.tween(herdOutU, 1, { at: 48.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 48.8, dur: 1.3, ease: ease.move });
  tl.tween(capU, 1, { at: 49.8, dur: 1.2, ease: ease.draw });

  // — beat 10 · our request lands —
  tl.caption({
    at: 54.4,
    dur: 5.6,
    text: "Here's our request under the full policy: fail, wait, fail, wait a little longer — and on the third attempt, it lands.",
  });
  tl.tween(ourU, 1, { at: 54.8, dur: 4.2, ease: ease.linear });

  // — beat 11 · recap + hook —
  tl.caption({
    at: 60.4,
    dur: 6.2,
    text: 'Three attempts, two backoffs, one success — and nobody watching would know it happened. That invisibility is the next problem to fix.',
  });
  tl.tween(recapU, 1, { at: 61.2, dur: 0.9, ease: ease.enter });
  tl.hold(66.0, 1.0);

  return {
    tl,
    cam,
    axisU,
    stepLblU,
    pulseU,
    stairU,
    mathU,
    soloOutU,
    herdU,
    histU,
    jitLblU,
    jitterU,
    herdOutU,
    capU,
    ourU,
    recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axisU = s.get(scene.axisU);
  const stepLblU = s.get(scene.stepLblU);
  const pulseU = s.get(scene.pulseU);
  const stairU = s.get(scene.stairU);
  const mathU = s.get(scene.mathU);
  const soloOutU = s.get(scene.soloOutU);
  const herdU = s.get(scene.herdU);
  const histU = s.get(scene.histU);
  const jitLblU = s.get(scene.jitLblU);
  const jitterU = s.get(scene.jitterU);
  const herdOutU = s.get(scene.herdOutU);
  const capU = s.get(scene.capU);
  const ourU = s.get(scene.ourU);
  const recapU = s.get(scene.recapU);

  const soloOp = axisU * (1 - soloOutU);
  const herdOp = herdU > 0.001 ? 1 - herdOutU * 0.88 : 0;
  const stageDim = 1 - recapU * 0.86;

  // phase C: our request on the solo axis (returns after the herd dims)
  const OUR_TIMES = [0, 110, 290]; // fail, fail, success (jittered flavor)
  const CAP_X = tx(SYNC_TIMES[4]) + 46; // budget wall just past attempt 5

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ---------------- phase A · one client's staircase ---------------- */}
          {soloOp > 0.01 && (
            <g opacity={soloOp}>
              <line x1={AXIS_X0 - 30} y1={SOLO_Y} x2={AXIS_X1 + 30} y2={SOLO_Y} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={AXIS_X1 + 28} y={SOLO_Y + 22} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                time →
              </text>
              <text x={AXIS_X0} y={128} fill={colors.TEXT} fontSize={16.5} fontFamily={MONO}>
                {'Effect.retry(call, { schedule: Schedule.exponential("100 millis") })'}
              </text>
              {stepLblU > 0.01 && (
                <text x={AXIS_X0} y={158} fill={colors.MUTED} fontSize={13.5} opacity={stepLblU} fontFamily={MONO}>
                  step(error) → wait(delay) | stop
                </text>
              )}
              {/* attempts */}
              {SYNC_TIMES.map((t, i) => {
                const u = win(pulseU, SYNC_TIMES.length, i, 1.4);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={tx(t)} cy={SOLO_Y} r={7} fill={colors.NEGATIVE} />
                    <text x={tx(t)} y={SOLO_Y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                      attempt {i + 1}
                    </text>
                  </g>
                );
              })}
              {/* staircase of delays */}
              {BASE_DELAYS.map((d, i) => {
                const u = win(stairU, BASE_DELAYS.length, i, 1.5);
                if (u <= 0) return null;
                const x0 = tx(SYNC_TIMES[i]);
                const x1 = tx(SYNC_TIMES[i + 1]);
                const h = STAIR_H(d) * u;
                return (
                  <g key={i} opacity={0.9}>
                    <rect x={x0 + 6} y={STAIR_BASE - h} width={x1 - x0 - 12} height={h} rx={5} fill={colors.ACCENT} opacity={0.28} />
                    <rect x={x0 + 6} y={STAIR_BASE - h} width={x1 - x0 - 12} height={h} rx={5} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} />
                    <text x={(x0 + x1) / 2} y={STAIR_BASE - h - 8} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO} opacity={u}>
                      {d}ms
                    </text>
                  </g>
                );
              })}
              {mathU > 0.01 && (
                <MathLabel
                  tex={'\\text{delay}_n = 100\\,\\text{ms}\\cdot 2^{\\,n-1}'}
                  x={870}
                  y={190}
                  fontSize={21}
                  color={colors.TEXT}
                  opacity={mathU}
                />
              )}
            </g>
          )}

          {/* ---------------- phase B · the herd ---------------- */}
          {herdOp > 0.01 && herdU > 0.001 && (
            <g opacity={herdOp}>
              {/* client rows */}
              {JIT_TIMES.map((ts, c) => {
                const u = win(herdU, N_CLIENTS, c, 3);
                if (u <= 0) return null;
                const y = rowY(c);
                return (
                  <g key={c} opacity={u}>
                    <line x1={AXIS_X0} y1={y} x2={AXIS_X1} y2={y} stroke={colors.GRID} strokeWidth={0.75} />
                    {ts.map((t, k) => {
                      const x = lerp(tx(SYNC_TIMES[k]), tx(t), jitterU);
                      return <circle key={k} cx={x} cy={y} r={3.4} fill={k === ts.length - 1 ? colors.POSITIVE : colors.NEGATIVE} opacity={0.85} />;
                    })}
                  </g>
                );
              })}
              <text x={AXIS_X0 - 14} y={(HERD_Y0 + HERD_Y1) / 2} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                24 clients
              </text>

              {/* load histogram */}
              {histU > 0.01 && (
                <g opacity={histU}>
                  <line x1={AXIS_X0} y1={HIST_BASE} x2={AXIS_X1} y2={HIST_BASE} stroke={colors.GRID} strokeWidth={1.2} />
                  <text x={AXIS_X0 - 14} y={HIST_BASE - 30} textAnchor="end" fill={colors.MUTED} fontSize={12.5}>
                    load
                  </text>
                  {SYNC_BINS.map((sc, b) => {
                    const count = lerp(sc, JIT_BINS[b], jitterU);
                    if (count < 0.05) return null;
                    const h = (count / N_CLIENTS) * HIST_HMAX * histU;
                    const x = AXIS_X0 + (b / N_BINS) * (AXIS_X1 - AXIS_X0);
                    const w = (AXIS_X1 - AXIS_X0) / N_BINS - 2;
                    const hot = count / N_CLIENTS;
                    return (
                      <rect
                        key={b}
                        x={x + 1}
                        y={HIST_BASE - h}
                        width={w}
                        height={h}
                        fill={hot > 0.6 ? colors.NEGATIVE : hot > 0.25 ? colors.WARM : colors.POSITIVE}
                        opacity={0.85}
                      />
                    );
                  })}
                </g>
              )}

              {/* jittered chip */}
              {jitLblU > 0.01 && (
                <g opacity={jitLblU}>
                  <rect x={860} y={104} width={300} height={44} rx={10} fill={colors.BG} stroke={colors.SECONDARY} />
                  <text x={1010} y={124} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>
                    .pipe(Schedule.jittered)
                  </text>
                  <text x={1010} y={141} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                    delay × random(0.8 … 1.2)
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---------------- phase C · the budget + our request ---------------- */}
          {capU > 0.01 && (
            <g opacity={capU}>
              <line x1={AXIS_X0 - 30} y1={SOLO_Y} x2={AXIS_X1 + 30} y2={SOLO_Y} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={AXIS_X0} y={128} fill={colors.TEXT} fontSize={16.5} fontFamily={MONO}>
                {'Effect.retry(call, { schedule, times: 5 })'}
              </text>
              {/* ghost of the 5 allowed attempts */}
              {SYNC_TIMES.map((t, i) => (
                <circle key={i} cx={tx(t)} cy={SOLO_Y} r={6} fill="none" stroke={colors.MUTED} strokeWidth={1.4} opacity={0.5} />
              ))}
              {/* the budget wall */}
              <line x1={CAP_X} y1={SOLO_Y - 96} x2={CAP_X} y2={SOLO_Y + 44} stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={CAP_X + 12} y={SOLO_Y - 74} fill={colors.NEGATIVE} fontSize={13.5} fontFamily={MONO}>
                budget spent → error surfaces
              </text>
            </g>
          )}
          {ourU > 0.01 && (
            <g>
              {OUR_TIMES.map((t, i) => {
                const u = win(ourU, OUR_TIMES.length, i, 1.3);
                if (u <= 0) return null;
                const ok = i === OUR_TIMES.length - 1;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={tx(t)} cy={SOLO_Y} r={9} fill={ok ? colors.POSITIVE : colors.NEGATIVE} />
                    <text x={tx(t)} y={SOLO_Y - 20} textAnchor="middle" fill={ok ? colors.POSITIVE : colors.NEGATIVE} fontSize={12.5}>
                      {ok ? 'success' : 'fail'}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* ---------------- recap ---------------- */}
        {recapU > 0.01 && (
          <g opacity={recapU}>
            <rect x={330} y={268} width={620} height={158} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={314} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
              failure with a plan
            </text>
            <text x={640} y={352} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily={MONO}>
              Schedule.exponential — back off, doubling
            </text>
            <text x={640} y={380} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontFamily={MONO}>
              Schedule.jittered — never in lockstep
            </text>
            <text x={640} y={408} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontFamily={MONO}>
              times: 5 — a budget, then the truth
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
