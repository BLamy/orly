// Chapter 4 — The Threshold Has Memory.
//
// Grounded in Section 8: threshold transition, path dependence, hysteresis,
// and epistemic debt. The curves are a visual model of the paper's local
// return comparison, not a fitted empirical law.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Axes, Brace, FunctionPlot, Vec } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

const X = scaleLinear<number, number>().domain([0, 1]).range([184, 1114]);
const Y = scaleLinear<number, number>().domain([0, 1]).range([532, 142]);
const THRESHOLD = 0.5;
const CORRECTION = (x: number) => 0.88 - 0.58 * x;
const MAINTENANCE = (x: number) => 0.18 + 0.62 * x;
const CAM_PLOT: CameraState = { x: 650, y: 338, k: 1.08 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const plotU = tl.channel('plotU', 1);
  const pressureU = tl.channel('pressureU', 0);
  const thresholdU = tl.channel('thresholdU', 0);
  const theaterU = tl.channel('theaterU', 0);
  const hysteresisU = tl.channel('hysteresisU', 0);
  const debtU = tl.channel('debtU', 0);
  const repairU = tl.channel('repairU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — below threshold is imperfect but recoverable.
  tl.caption({
    at: 0.1,
    dur: 6.3,
    text: 'Not every distortion is a regime. Below the threshold, a flawed metric or output can still meet a correction that travels through the workflow.',
  });
  tl.tween(thresholdU, 1, { at: 0.15, dur: 1.2, ease: ease.draw });
  tl.tween(pressureU, 0.26, { at: 0.5, dur: 1.1, ease: ease.move });
  tl.hold(6.8, 0.6);

  // Beat 1 — local returns start to separate.
  tl.caption({
    at: 7.4,
    dur: 6.2,
    text: 'The useful question is local return. What does the person who checks the source gain, and what does the person who preserves the story gain?',
  });
  tl.tween(cam, CAM_PLOT, { at: 7.5, dur: 1.3, ease: ease.move });
  tl.hold(13.6, 0.6);

  // Beat 2 — approach the crossing.
  tl.caption({
    at: 14.2,
    dur: 6.3,
    text: 'As pressure rises, the return on correction falls below the return on narrative maintenance. The marker is approaching a change in operating logic, not merely a bad score.',
  });
  tl.tween(pressureU, 0.72, { at: 14.8, dur: 2.4, ease: ease.move });
  tl.tween(thresholdU, 1, { at: 16.0, dur: 0.8, ease: ease.enter });
  tl.hold(20.9, 0.6);

  // Beat 3 — cross into the theater.
  tl.caption({
    at: 21.5,
    dur: 6.3,
    text: 'At the crossing, narrative stabilization wins locally. Dissent can remain formally permitted and still become functionally neutralized.',
  });
  tl.tween(theaterU, 1, { at: 22.0, dur: 1.0, ease: ease.pop });
  tl.tween(pressureU, 0.88, { at: 22.4, dur: 1.1, ease: ease.move });
  tl.hold(28.4, 0.6);

  // Beat 4 — hysteresis.
  tl.caption({
    at: 29.0,
    dur: 6.4,
    text: 'Then hysteresis appears. A better dashboard or a cautious memo may move one point, while the surrounding regime keeps the old appearance stable.',
  });
  tl.tween(hysteresisU, 1, { at: 29.6, dur: 1.5, ease: ease.draw });
  tl.tween(repairU, 0.45, { at: 31.0, dur: 1.0, ease: ease.move });
  tl.hold(35.9, 0.6);

  // Beat 5 — debt accumulates.
  tl.caption({
    at: 36.5,
    dur: 6.3,
    text: 'The residue is epistemic debt: unresolved contradictions, provisional claims treated as settled, and explanations that preserve the record instead of reopening it.',
  });
  tl.tween(debtU, 1, { at: 37.1, dur: 2.0, ease: ease.enter });
  tl.hold(43.4, 0.6);

  // Beat 6 — single-point repair is absorbed.
  tl.caption({
    at: 44.0,
    dur: 6.5,
    text: 'That is why single-point repair is often absorbed. The coupled system can accommodate a local improvement without reopening correction across the path that made the debt.',
  });
  tl.tween(repairU, 1, { at: 44.6, dur: 1.2, ease: ease.move });
  tl.tween(hysteresisU, 1, { at: 45.0, dur: 0.9, ease: ease.move });
  tl.hold(50.5, 0.6);

  // Beat 7 — close with the threshold question.
  tl.caption({
    at: 51.1,
    dur: 6.6,
    text: 'The threshold test is therefore practical: can a principled intervention restore a live path to revision, or does the system route it back as another problem to explain away?',
  });
  tl.tween(dimU, 1, { at: 51.5, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.7, dur: 0.9, ease: ease.enter });
  tl.hold(58.5, 1.0);

  return { tl, cam, plotU, pressureU, thresholdU, theaterU, hysteresisU, debtU, repairU, dimU, closeU };
}

const scene = buildScene();

function Hysteresis({ u, repair }: { u: number; repair: number }) {
  const opacity = clamp01(u * 1.8);
  const repairX = X(0.72 - repair * 0.18);
  const repairY = Y(0.40 + repair * 0.18);
  return (
    <g opacity={opacity}>
      <path d={`M ${X(0.52)} ${Y(0.50)} C ${X(0.60)} ${Y(0.42)} ${X(0.74)} ${Y(0.35)} ${X(0.82)} ${Y(0.28)} C ${X(0.72)} ${Y(0.22)} ${X(0.60)} ${Y(0.31)} ${repairX} ${repairY}`} fill="none" stroke={colors.WARM} strokeWidth={4} strokeDasharray="12 8" />
      <Vec x1={X(0.69)} y1={Y(0.31)} x2={X(0.78)} y2={Y(0.27)} grow={opacity} color={colors.WARM} width={3} label="path dependence" labelAt="mid" labelSize={11} />
      <circle cx={repairX} cy={repairY} r={10} fill={colors.ACCENT} />
      <text x={repairX} y={repairY - 18} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>local repair</text>
    </g>
  );
}

function Debt({ u }: { u: number }) {
  const labels = ['contradictions', 'provisional claims', 'post hoc stories'];
  return (
    <g opacity={clamp01(u * 1.5)}>
      <text x={870} y={564} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>epistemic debt</text>
      {labels.map((label, i) => {
        const h = (30 + i * 18) * u;
        return (
          <g key={label}>
            <rect x={870 + i * 84} y={552 - h} width={54} height={h} rx={8} fill={colors.NEGATIVE} opacity={0.35 + i * 0.14} />
            <text x={897 + i * 84} y={584} textAnchor="middle" fill={colors.MUTED} fontSize={9}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const plotU = s.get(scene.plotU);
  const pressure = s.get(scene.pressureU);
  const threshold = s.get(scene.thresholdU);
  const theater = s.get(scene.theaterU);
  const hysteresis = s.get(scene.hysteresisU);
  const debt = s.get(scene.debtU);
  const repair = s.get(scene.repairU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);
  const markerPressure = 0.12 + 0.78 * clamp01(pressure);
  const markerX = X(markerPressure);
  const markerY = Y(markerPressure >= THRESHOLD ? MAINTENANCE(markerPressure) : CORRECTION(markerPressure));
  const crossed = markerPressure >= THRESHOLD;

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        The threshold has memory
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        correction can be globally necessary and locally irrational
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <rect x={120} y={100} width={1040} height={486} rx={26} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={158} y={134} fill={colors.TEXT} fontSize={16} fontWeight={700}>threshold transition</text>
          <Axes x={X} y={Y} reveal={plotU} xLabel="pressure" yLabel="local return" xTicks={5} yTicks={4} />
          <FunctionPlot x={X} y={Y} f={CORRECTION} reveal={plotU} color={colors.POSITIVE} width={4} />
          <FunctionPlot x={X} y={Y} f={MAINTENANCE} reveal={plotU} color={colors.NEGATIVE} width={4} />
          <text x={X(0.08)} y={Y(CORRECTION(0.08)) - 18} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>correction return</text>
          <text x={X(0.72)} y={Y(MAINTENANCE(0.72)) - 18} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>maintenance return</text>
          <line x1={X(THRESHOLD)} y1={Y(0)} x2={X(THRESHOLD)} y2={Y(1)} stroke={colors.WARM} strokeWidth={2} strokeDasharray="8 8" opacity={threshold} />
          <text x={X(THRESHOLD) + 12} y={Y(0.96)} fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={threshold}>threshold</text>
          <circle cx={markerX} cy={markerY} r={26} fill={crossed ? colors.NEGATIVE : colors.POSITIVE} opacity={0.14 + theater * 0.12} />
          <circle cx={markerX} cy={markerY} r={9} fill={crossed ? colors.NEGATIVE : colors.POSITIVE} />
          <text x={markerX} y={markerY - 20} textAnchor="middle" fill={crossed ? colors.NEGATIVE : colors.POSITIVE} fontSize={11} fontFamily={MONO}>
            {crossed ? 'theater' : 'recoverable'}
          </text>
          <Hysteresis u={hysteresis} repair={repair} />
          <Debt u={debt} />
          <Brace x0={X(0.08)} x1={X(0.48)} y={Y(0.07)} below depth={12} u={clamp01(plotU * 1.2)} color={colors.POSITIVE} label="correction remains live" fontSize={11} />
          <MathLabel tex={'R_{\mathrm{correction}} < R_{\mathrm{maintenance}}'} x={640} y={118} fontSize={19} color={colors.WARM} opacity={theater} />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={156} y={228} width={968} height={216} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
        <text x={640} y={290} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>A better point is not a restored path</text>
        <text x={640} y={338} textAnchor="middle" fill={colors.WARM} fontSize={19}>test whether correction can travel again</text>
        <text x={640} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>threshold → hysteresis → epistemic debt</text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
