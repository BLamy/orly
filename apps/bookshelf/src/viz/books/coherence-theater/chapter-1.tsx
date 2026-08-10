// Chapter 1 — The Orderly Failure.
//
// Grounded in the paper's abstract, Sections 1, 3, and 4, and its central
// distinction: Adversarial Epistemic Incoherence is the regime; coherence
// theater is the visible performance layer that can remain tidy after
// correction has degraded. The paper itself is on stage from frame zero so
// the chapter opens with source, not a blank title card.
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
import type { CameraState, SceneState } from '../../core';
import { Axes, FunctionPlot, Vec } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const PAPER = '#f6f1e7';
const PAPER_INK = '#172033';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

const PLOT_X = scaleLinear<number, number>().domain([0, 1]).range([630, 1160]);
const PLOT_Y = scaleLinear<number, number>().domain([0, 1]).range([520, 154]);

// The curves are an illustrative reading of the paper's force balance, not
// an empirical estimate. Pressure is on the x axis; local return is on y.
const CORRECTION_RETURN = (pressure: number) => 0.86 - pressure * 0.62;
const MAINTENANCE_RETURN = (pressure: number) => 0.16 + pressure * 0.66;
const CROSSING = 0.515;

const CAM_PAPER: CameraState = { x: 290, y: 316, k: 1.22 };
const CAM_PLOT: CameraState = { x: 888, y: 346, k: 1.12 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chartU = tl.channel('chartU', 0);
  const curveU = tl.channel('curveU', 0);
  const pageGlow = tl.channel('pageGlow', 0);
  const splitU = tl.channel('splitU', 0);
  const pressureU = tl.channel('pressureU', 0);
  const crossingU = tl.channel('crossingU', 0);
  const theaterU = tl.channel('theaterU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the source paper is already visible at t = 0.05.
  tl.caption({
    at: 0.05,
    dur: 6.4,
    text: 'The paper begins with a quiet trap: a system can keep producing tidy reports while the machinery that corrects them is wearing away.',
  });
  tl.tween(pageGlow, 1, { at: 0.05, dur: 0.7, ease: ease.enter });
  tl.tween(chartU, 1, { at: 0.25, dur: 1.4, ease: ease.draw });
  tl.tween(curveU, 1, { at: 1.2, dur: 1.4, ease: ease.draw });
  tl.hold(6.8, 0.6);

  // Beat 1 — regime versus manifestation.
  tl.caption({
    at: 7.4,
    dur: 6.2,
    text: 'It names the regime Adversarial Epistemic Incoherence, and calls the polished surface it produces coherence theater. One is the condition; the other is the show.',
  });
  tl.tween(cam, CAM_PAPER, { at: 7.5, dur: 1.3, ease: ease.move });
  tl.tween(splitU, 1, { at: 8.2, dur: 1.1, ease: ease.enter });
  tl.tween(pageGlow, 0.35, { at: 10.4, dur: 0.8, ease: ease.move });
  tl.hold(13.9, 0.6);

  // Beat 2 — coherent-looking output is not correction-enabling coherence.
  tl.caption({
    at: 14.5,
    dur: 6.4,
    text: 'The distinction is easy to miss because the output can stay smooth. Coherence may still help a team act, or it may be carrying distortion faster than anyone can challenge it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.7, dur: 1.3, ease: ease.move });
  tl.tween(theaterU, 0.65, { at: 15.1, dur: 1.0, ease: ease.enter });
  tl.hold(21.5, 0.6);

  // Beat 3 — put pressure on the two returns.
  tl.caption({
    at: 22.1,
    dur: 6.1,
    text: 'Now put local pressure on the system. The reward for maintaining a legible story rises, while the return on checking, refusing, or escalating falls.',
  });
  tl.tween(cam, CAM_PLOT, { at: 22.2, dur: 1.3, ease: ease.move });
  tl.tween(pressureU, 1, { at: 22.8, dur: 2.1, ease: ease.move });
  tl.tween(theaterU, 1, { at: 24.3, dur: 0.8, ease: ease.pop });
  tl.hold(28.8, 0.6);

  // Beat 4 — the crossing is a pricing condition, not a dramatic failure.
  tl.caption({
    at: 29.4,
    dur: 6.5,
    text: 'The crossing is not a dramatic crash. It is a pricing condition: correction becomes locally irrational even when the wider system still needs it.',
  });
  tl.tween(crossingU, 1, { at: 29.9, dur: 1.2, ease: ease.enter });
  tl.tween(pageGlow, 0.12, { at: 31.0, dur: 0.7, ease: ease.move });
  tl.hold(36.5, 0.6);

  // Beat 5 — path dependence makes the visible show self-stabilizing.
  tl.caption({
    at: 37.1,
    dur: 6.3,
    text: 'Above that threshold, narrative maintenance outcompetes evidential revision. The system has not lost coherence; it has detached coherence from correction.',
  });
  tl.tween(pressureU, 1.18, { at: 37.4, dur: 1.3, ease: ease.move });
  tl.tween(theaterU, 1, { at: 38.2, dur: 0.7, ease: ease.pop });
  tl.hold(44.0, 0.6);

  // Beat 6 — land the chapter on the paper's thesis.
  tl.caption({
    at: 44.6,
    dur: 6.4,
    text: 'So the paper asks us to watch movement, not just symptoms: how correction-suppressing conditions travel until a coherent fiction becomes the safest thing to preserve.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 44.8, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 45.2, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 46.3, dur: 0.9, ease: ease.enter });
  tl.hold(52.0, 1.0);

  return { tl, cam, chartU, curveU, pageGlow, splitU, pressureU, crossingU, theaterU, dimU, closeU };
}

const scene = buildScene();

function PaperSheet({ glow, split }: { glow: number; split: number }) {
  const leftOpacity = 1 - 0.7 * split;
  const rightOpacity = 0.25 + 0.75 * split;
  return (
    <g transform="translate(60 92)">
      <rect x={-10} y={-10} width={456} height={496} rx={18} fill={colors.ACCENT} opacity={0.1 + glow * 0.14} />
      <rect width={436} height={476} rx={10} fill={PAPER} stroke={colors.ACCENT} strokeWidth={2} />
      <text x={218} y={38} textAnchor="middle" fill={PAPER_INK} fontSize={18} fontFamily="Georgia, serif" fontWeight={700}>
        Now Playing in Coherence Theaters
      </text>
      <text x={218} y={61} textAnchor="middle" fill={PAPER_INK} fontSize={18} fontFamily="Georgia, serif" fontWeight={700}>
        Near You
      </text>
      <text x={218} y={88} textAnchor="middle" fill="#4a5568" fontSize={11} fontFamily="Georgia, serif" fontStyle="italic">
        AEI Propagation Vectors in Socio-Technical Systems
      </text>
      <text x={218} y={116} textAnchor="middle" fill="#4a5568" fontSize={10} fontFamily="Georgia, serif">
        Jeremy B. Dixon · Independent Researcher
      </text>
      <line x1={32} y1={134} x2={404} y2={134} stroke="#b3a995" />
      <text x={32} y={158} fill={PAPER_INK} fontSize={12} fontFamily="Georgia, serif" fontWeight={700}>Abstract</text>
      <g opacity={leftOpacity}>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={32} y1={183 + i * 18} x2={390 - (i % 2) * 34} y2={183 + i * 18} stroke="#7d8490" strokeWidth={2.5} opacity={0.72} />
        ))}
      </g>
      <g opacity={rightOpacity}>
        <rect x={30} y={286} width={376} height={110} rx={8} fill="#eae3d7" stroke="#bdaf9b" />
        <text x={48} y={310} fill={PAPER_INK} fontSize={11} fontFamily={MONO}>AEI → propagation → threshold</text>
        <text x={48} y={338} fill="#596477" fontSize={10} fontFamily="Georgia, serif">Correction priced out of ordinary operation.</text>
        <text x={48} y={361} fill="#596477" fontSize={10} fontFamily="Georgia, serif">Legibility remains; revision becomes costly.</text>
        <text x={48} y={384} fill="#596477" fontSize={10} fontFamily="Georgia, serif">The visible result: coherence theater.</text>
      </g>
      <text x={32} y={440} fill="#8a8172" fontSize={9} fontFamily={MONO}>SSRN 7212700</text>
      <text x={404} y={440} textAnchor="end" fill="#8a8172" fontSize={9} fontFamily={MONO}>1</text>
    </g>
  );
}

function ReturnMarker({ u, crossing }: { u: number; crossing: number }) {
  const pressure = Math.min(0.92, 0.12 + 0.76 * clamp01(u));
  const x = PLOT_X(pressure);
  const y = PLOT_Y(CORRECTION_RETURN(pressure));
  const crossed = pressure >= crossing;
  return (
    <g opacity={clamp01(u * 2)}>
      <circle cx={x} cy={y} r={24} fill={crossed ? colors.NEGATIVE : colors.POSITIVE} opacity={0.14} />
      <circle cx={x} cy={y} r={8} fill={crossed ? colors.NEGATIVE : colors.POSITIVE} />
      <text x={x} y={y - 18} textAnchor="middle" fill={crossed ? colors.NEGATIVE : colors.POSITIVE} fontSize={12} fontFamily={MONO}>
        {crossed ? 'theater' : 'correction'}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const chartU = s.get(scene.chartU);
  const curveU = s.get(scene.curveU);
  const pageGlow = s.get(scene.pageGlow);
  const split = s.get(scene.splitU);
  const pressure = s.get(scene.pressureU);
  const crossing = s.get(scene.crossingU);
  const theater = s.get(scene.theaterU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);
  const crossingX = PLOT_X(CROSSING);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        The orderly failure
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        SSRN 7212700 · a paper about coherence that can outlive correction
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <PaperSheet glow={pageGlow} split={split} />
          <g opacity={chartU}>
            <rect x={570} y={110} width={640} height={452} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={610} y={143} fill={colors.TEXT} fontSize={16} fontWeight={700}>The local correction economy</text>
            <text x={610} y={168} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>pressure changes which policy pays</text>
            <Axes x={PLOT_X} y={PLOT_Y} reveal={chartU} xLabel="local pressure" yLabel="local return" xTicks={5} yTicks={4} />
            <FunctionPlot x={PLOT_X} y={PLOT_Y} f={CORRECTION_RETURN} reveal={curveU} color={colors.POSITIVE} width={4} />
            <FunctionPlot x={PLOT_X} y={PLOT_Y} f={MAINTENANCE_RETURN} reveal={curveU} color={colors.NEGATIVE} width={4} />
            <text x={PLOT_X(0.1)} y={PLOT_Y(CORRECTION_RETURN(0.1)) - 18} fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>correction</text>
            <text x={PLOT_X(0.73)} y={PLOT_Y(MAINTENANCE_RETURN(0.73)) - 16} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>narrative maintenance</text>
            <line x1={crossingX} y1={145} x2={crossingX} y2={540} stroke={colors.WARM} strokeWidth={2} strokeDasharray="7 8" opacity={crossing} />
            <text x={crossingX + 10} y={194} fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={crossing}>threshold</text>
            <ReturnMarker u={pressure} crossing={CROSSING} />
            <g opacity={theater}>
              <rect x={760} y={198} width={326} height={56} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={923} y={222} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>coherence theater</text>
              <text x={923} y={242} textAnchor="middle" fill={colors.TEXT} fontSize={11}>smooth output · hollowed correction</text>
            </g>
          </g>
          <g opacity={split}>
            <Vec x1={505} y1={256} x2={556} y2={256} grow={split} color={colors.ACCENT} width={3} label="visible performance" labelAt="mid" labelSize={11} />
            <Vec x1={505} y1={382} x2={556} y2={382} grow={split} color={colors.NEGATIVE} width={3} label="degraded correction" labelAt="mid" labelSize={11} />
          </g>
          <MathLabel tex={'\text{maintenance} > \text{correction}'} x={890} y={590} fontSize={22} color={colors.WARM} opacity={crossing} />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={170} y={230} width={940} height={224} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
        <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>Coherence can remain after correction leaves</text>
        <text x={640} y={338} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>AEI is the moving regime</text>
        <text x={640} y={374} textAnchor="middle" fill={colors.NEGATIVE} fontSize={18}>coherence theater is what the audience sees</text>
        <text x={640} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>the next question: how does the pressure couple?</text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
