// Chapter 4 — The Threshold Has Memory.
//
// Grounded in Section 8 (thresholds and regime transition: the crossing,
// path dependence, hysteresis, epistemic debt) and Section 9 (why resistance
// fails: five linked mechanisms). The centerpiece is an honest hysteresis
// loop: the marker rides the correction return up through rising pressure,
// crosses where maintenance starts paying more, and then — when pressure is
// RELAXED — does not come back the way it went in. It stays on the
// maintenance branch well past the original crossing, because the system has
// reorganized around the artifacts and incentives that need correction. The
// area swept between the two paths is drawn as what the paper says it is:
// epistemic debt, a stock that keeps being serviced by further narrative
// maintenance. The curves are a visual model of the paper's local-return
// comparison, not a fitted law.
import { scaleLinear } from 'd3';
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

const X = scaleLinear<number, number>().domain([0, 1]).range([190, 850]);
const Y = scaleLinear<number, number>().domain([0, 1]).range([520, 150]);

const CORRECTION = (x: number) => 0.86 - 0.56 * x;
const MAINTENANCE = (x: number) => 0.16 + 0.62 * x;
const T_UP = 0.53; // where maintenance starts paying more (going up)
const T_DOWN = 0.28; // where correction finally pays again (coming back)

// The marker's journey as a function of progress p ∈ [0, 1]:
// 0 → 0.5   pressure rises  x: 0.08 → 0.88, on correction until T_UP then maintenance
// 0.5 → 1   pressure falls  x: 0.88 → 0.16, STAYING on maintenance until T_DOWN
function markerAt(p: number): { x: number; y: number; crossed: boolean; returning: boolean } {
  if (p <= 0.5) {
    const x = 0.08 + (p / 0.5) * 0.8;
    const crossed = x >= T_UP;
    return { x, y: crossed ? MAINTENANCE(x) : CORRECTION(x), crossed, returning: false };
  }
  const x = 0.88 - ((p - 0.5) / 0.5) * 0.72;
  const crossed = x >= T_DOWN;
  return { x, y: crossed ? MAINTENANCE(x) : CORRECTION(x), crossed, returning: true };
}

// Section 9's five mechanisms, in the paper's order.
const MECHANISMS = [
  'local and global incentives diverge',
  'coordination fails — private doubt, public silence',
  'correction is recoded as dysfunction',
  'distorted outputs feed future baselines',
  'oversight inherits the same pressures',
] as const;

const CAM_PLOT: CameraState = { x: 560, y: 340, k: 1.12 };
const CAM_LOOP: CameraState = { x: 480, y: 330, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  plotU: ChannelRef<number>;
  progressU: ChannelRef<number>;
  thresholdU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  debtU: ChannelRef<number>;
  mechU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const plotU = tl.channel('plotU', 0);
  const progressU = tl.channel('progressU', 0);
  const thresholdU = tl.channel('thresholdU', 0);
  const loopU = tl.channel('loopU', 0);
  const debtU = tl.channel('debtU', 0);
  const mechU = tl.channel('mechU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the local correction economy.
  tl.caption({
    at: 0.1,
    dur: 6.6,
    text: 'The paper puts the threshold in economic terms. Draw two returns against local pressure: what the person who checks the source gains, and what the person who preserves the story gains. Every actor who must keep the system moving reads this chart, whether they know it or not.',
  });
  tl.tween(plotU, 1, { at: 0.2, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 0.4, dur: 1.4, ease: ease.move });
  tl.hold(7.1, 0.6);

  // Beat 1 — below threshold, flawed but alive.
  tl.caption({
    at: 7.7,
    dur: 6.6,
    text: 'Below the crossing, systems can still be flawed. Metrics may be imperfect and errors may recur — but disagreement remains actionable, dissent still has institutional pathways, and correction is part of the live operating logic. Distortion here is recoverable.',
  });
  tl.tween(progressU, 0.24, { at: 8.2, dur: 2.2, ease: ease.move });
  tl.hold(14.7, 0.6);

  // Beat 2 — the crossing.
  tl.caption({
    at: 15.3,
    dur: 6.8,
    text: 'Then pressure rises and the lines cross. Correction becomes locally irrational even when it is globally necessary: the cost of challenging, verifying, or refusing a coherent fiction now exceeds the reward for maintaining it. Nothing dramatic happens at this moment. That is the point.',
  });
  tl.tween(thresholdU, 1, { at: 15.6, dur: 1.0, ease: ease.enter });
  tl.tween(progressU, 0.5, { at: 16.2, dur: 3.2, ease: ease.move });
  tl.hold(22.5, 0.6);

  // Beat 3 — above threshold.
  tl.caption({
    at: 23.1,
    dur: 6.6,
    text: 'Above the threshold, narrative stabilization outcompetes evidential revision. Dissent can stay formally permitted and be functionally neutralized. Provisional artifacts harden. Evaluators inherit distorted baselines. The system is not stuck; it is settled.',
  });
  tl.hold(30.1, 0.6);

  // Beat 4 — now relax the pressure: hysteresis.
  tl.caption({
    at: 30.7,
    dur: 7.2,
    text: 'Here is the part that makes the threshold interesting. Reduce the pressure — better leadership, a calmer quarter, a more cautious model — and watch the marker. It does not retrace its path. It rides the maintenance branch far back past the original crossing, because the system has already reorganized around the artifacts that need correcting.',
  });
  tl.tween(cam, CAM_LOOP, { at: 30.9, dur: 1.5, ease: ease.move });
  tl.tween(loopU, 1, { at: 31.4, dur: 1.2, ease: ease.draw });
  tl.tween(progressU, 0.88, { at: 31.9, dur: 4.6, ease: ease.move });
  tl.hold(38.5, 0.6);

  // Beat 5 — the loop closes; the area is debt.
  tl.caption({
    at: 39.1,
    dur: 7.0,
    text: 'Only far below the original threshold does correction pay again. The two paths enclose an area, and the paper names what accumulated inside it: epistemic debt. Unresolved contradictions, provisional claims treated as settled, explanations that preserve the record instead of reopening it — a stock that can be serviced by more narrative long after the position is unsustainable.',
  });
  tl.tween(progressU, 1, { at: 39.6, dur: 2.2, ease: ease.move });
  tl.tween(debtU, 1, { at: 40.6, dur: 2.6, ease: ease.enter });
  tl.hold(46.7, 0.6);

  // Beat 6 — why single-point repair is absorbed.
  tl.caption({
    at: 47.3,
    dur: 7.2,
    text: 'This is why recognition alone does not restore the system, and the paper lists five reasons. Local and global incentives diverge. Coordination fails — many privately doubt, none can safely move first. Correction itself gets recoded as dysfunction. Distorted outputs feed the next cycle’s baselines. And oversight inherits the very pressures it was meant to interrupt.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 47.5, dur: 1.4, ease: ease.move });
  tl.tween(mechU, 1, { at: 48.1, dur: 3.6, ease: ease.linear });
  tl.hold(54.9, 0.6);

  // Beat 7 — close.
  tl.caption({
    at: 55.5,
    dur: 6.6,
    text: 'So the threshold has memory: getting out costs far more than getting in, and a better dashboard moves one point while the regime keeps the appearance stable. The practical question is not whether the system looks better. It is whether a principled intervention can make correction travel again — which is the final chapter.',
  });
  tl.tween(dimU, 1, { at: 55.9, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 57.0, dur: 0.9, ease: ease.enter });
  tl.hold(62.5, 1.2);

  return { tl, cam, plotU, progressU, thresholdU, loopU, debtU, mechU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** The swept trail of the marker's journey up to progress p. */
function trailPath(p: number): string {
  const steps = Math.max(2, Math.floor(p * 90));
  const pts = Array.from({ length: steps }, (_, i) => {
    const m = markerAt((i / (steps - 1)) * p);
    return `${X(m.x).toFixed(1)} ${Y(m.y).toFixed(1)}`;
  });
  return `M ${pts.join(' L ')}`;
}

/** The closed hysteresis-loop region between the two branches. */
function loopRegion(): string {
  const up: string[] = [];
  const down: string[] = [];
  for (let x = T_DOWN; x <= T_UP; x += 0.01) {
    up.push(`${X(x).toFixed(1)} ${Y(CORRECTION(x)).toFixed(1)}`);
    down.push(`${X(x).toFixed(1)} ${Y(MAINTENANCE(x)).toFixed(1)}`);
  }
  return `M ${up.join(' L ')} L ${down.reverse().join(' L ')} Z`;
}

export function Render({ s }: { s: SceneState }) {
  const plotU = s.get(scene.plotU);
  const progressU = s.get(scene.progressU);
  const thresholdU = s.get(scene.thresholdU);
  const loopU = s.get(scene.loopU);
  const debtU = s.get(scene.debtU);
  const mechU = s.get(scene.mechU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);

  const m = markerAt(clamp01(progressU));
  const markerColor = m.crossed ? colors.NEGATIVE : colors.POSITIVE;
  const debtAmount = clamp01(debtU) * 0.9 + clamp01(progressU - 0.4) * 0.1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        The threshold has memory
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        the way out is not the way in · hysteresis and epistemic debt
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <rect x={120} y={100} width={780} height={486} rx={26} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={158} y={134} fill={colors.TEXT} fontSize={16} fontWeight={700}>
            the correction economy
          </text>
          <text x={158} y={156} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            what each policy pays, locally, as pressure moves
          </text>
          <Axes x={X} y={Y} reveal={plotU} xLabel="local pressure" yLabel="local return" xTicks={5} yTicks={4} />
          <FunctionPlot x={X} y={Y} f={CORRECTION} reveal={plotU} color={colors.POSITIVE} width={3.5} />
          <FunctionPlot x={X} y={Y} f={MAINTENANCE} reveal={plotU} color={colors.NEGATIVE} width={3.5} />
          <text x={X(0.06)} y={Y(CORRECTION(0.06)) - 16} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
            correction return
          </text>
          <text x={X(0.66)} y={Y(MAINTENANCE(0.66)) - 16} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>
            maintenance return
          </text>

          {/* the two thresholds */}
          <line x1={X(T_UP)} y1={Y(0)} x2={X(T_UP)} y2={Y(0.98)} stroke={colors.WARM} strokeWidth={2} strokeDasharray="8 8" opacity={thresholdU} />
          <text x={X(T_UP) + 10} y={Y(0.94)} fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={thresholdU}>
            crossing (in)
          </text>
          <line x1={X(T_DOWN)} y1={Y(0)} x2={X(T_DOWN)} y2={Y(0.98)} stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="4 8" opacity={loopU} />
          <text x={X(T_DOWN) + 10} y={Y(0.94)} fill={colors.ACCENT} fontSize={11} fontFamily={MONO} opacity={loopU}>
            crossing (out)
          </text>

          {/* the enclosed loop = epistemic debt */}
          <path d={loopRegion()} fill={colors.NEGATIVE} opacity={0.16 * clamp01(debtU * 1.4)} stroke={colors.NEGATIVE} strokeWidth={1} strokeOpacity={0.35 * debtU} />
          {debtU > 0.25 && (
            <text x={X((T_DOWN + T_UP) / 2)} y={Y((CORRECTION(0.4) + MAINTENANCE(0.4)) / 2)} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO} fontWeight={700} opacity={clamp01(debtU * 1.6 - 0.4)}>
              epistemic debt
            </text>
          )}

          {/* the marker's swept trail + marker */}
          {progressU > 0.01 && (
            <path d={trailPath(clamp01(progressU))} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={0.8} strokeDasharray={m.returning ? '10 6' : undefined} />
          )}
          <circle cx={X(m.x)} cy={Y(m.y)} r={22} fill={markerColor} opacity={0.15} />
          <circle cx={X(m.x)} cy={Y(m.y)} r={8} fill={markerColor} />
          <text x={X(m.x)} y={Y(m.y) - 18} textAnchor="middle" fill={markerColor} fontSize={11} fontFamily={MONO}>
            {m.returning ? (m.crossed ? 'pressure falling — still theater' : 'correction pays again') : m.crossed ? 'theater' : 'recoverable'}
          </text>

          {/* the debt stock */}
          <g opacity={clamp01(Math.max(debtU, progressU - 0.45) * 2)}>
            <rect x={950} y={140} width={190} height={440} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={1045} y={172} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
              the debt stock
            </text>
            <rect x={986} y={196} width={118} height={330} rx={10} fill="#101827" stroke={colors.GRID} />
            <rect x={986} y={196 + 330 * (1 - debtAmount)} width={118} height={330 * debtAmount} rx={10} fill={colors.NEGATIVE} opacity={0.55} />
            {['post hoc stories', 'settled claims', 'contradictions'].map((label, i) => (
              <text key={label} x={1045} y={506 - i * 34} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO} opacity={clamp01(debtAmount * 3 - i * 0.8)}>
                {label}
              </text>
            ))}
            <text x={1045} y={556} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              serviced, not repaid
            </text>
          </g>

          {/* Section 9's five mechanisms */}
          {mechU > 0 && (
            <g opacity={clamp01(mechU * 1.4)}>
              {MECHANISMS.map((label, i) => (
                <g key={label} opacity={clamp01(mechU * 6 - i)}>
                  <circle cx={160 + (i % 5) * 200} cy={625} r={6} fill={colors.NEGATIVE} />
                  <text x={176 + (i % 5) * 200} y={629} fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                    {label.length > 30 ? label.slice(0, 29) + '…' : label}
                  </text>
                </g>
              ))}
              <text x={160} y={604} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                why recognition alone does not restore it:
              </text>
            </g>
          )}

          <MathLabel tex={'R_{\\mathrm{correction}} < R_{\\mathrm{maintenance}}'} x={512} y={122} fontSize={18} color={colors.WARM} opacity={thresholdU} />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={156} y={226} width={968} height={224} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
        <text x={640} y={290} textAnchor="middle" fill={colors.TEXT} fontSize={33} fontWeight={800}>
          Getting out costs more than getting in
        </text>
        <text x={640} y={336} textAnchor="middle" fill={colors.WARM} fontSize={18}>
          two crossings, one loop — and the area inside it is debt
        </text>
        <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          a better point is not a restored path · next: the intervention test
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
