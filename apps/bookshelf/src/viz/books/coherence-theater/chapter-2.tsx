// Chapter 2 — Five Forces, One Balance.
//
// Grounded in Section 5 and Figure 1: authority load, incentive alignment,
// individual risk, signal integrity, and evaluation stability are force pairs.
// The paper's claim is about coupling, so the grid becomes one balance rather
// than five unrelated warnings.
import { interpolateRgb } from 'd3';
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
import { MatrixGrid, Vec } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const forceFill = (v: number, color: string) => interpolateRgb('#0d1321', color)(clamp01(v));

const ROWS = ['authority', 'incentive', 'dissent', 'signal', 'evaluation'];
const HEALTHY = [
  [0.24, 0.88],
  [0.28, 0.82],
  [0.18, 0.86],
  [0.22, 0.84],
  [0.30, 0.78],
];
const THEATER = [
  [0.82, 0.30],
  [0.86, 0.24],
  [0.90, 0.18],
  [0.78, 0.26],
  [0.84, 0.20],
];

const CAM_GRID: CameraState = { x: 525, y: 334, k: 1.17 };
const CAM_BALANCE: CameraState = { x: 875, y: 328, k: 1.18 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const modeU = tl.channel('modeU', 0);
  const focusRow = tl.channel('focusRow', -1);
  const focusU = tl.channel('focusU', 0);
  const coupleU = tl.channel('coupleU', 0);
  const glowU = tl.channel('glowU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the two-column ledger.
  tl.caption({
    at: 0.1,
    dur: 6.4,
    text: 'A system needs enough coherence to act, and enough correction to stay answerable to reality. The paper turns that tension into a force balance.',
  });
  tl.tween(gridU, 1, { at: 0.15, dur: 1.5, ease: ease.draw });
  tl.tween(glowU, 1, { at: 1.0, dur: 0.7, ease: ease.enter });
  tl.hold(6.9, 0.6);

  // Beat 1 — authority and resistance.
  tl.caption({
    at: 7.5,
    dur: 6.0,
    text: 'First, authority load meets resistance capacity. A mandate is not the problem; a mandate without the right to refuse or escalate is a propagation path.',
  });
  tl.tween(cam, CAM_GRID, { at: 7.6, dur: 1.3, ease: ease.move });
  tl.tween(focusRow, 0, { at: 8.2, dur: 0.4, ease: ease.move });
  tl.tween(focusU, 1, { at: 8.6, dur: 0.5, ease: ease.enter });
  tl.hold(13.5, 0.6);

  // Beat 2 — reward versus truth pressure.
  tl.caption({
    at: 14.1,
    dur: 6.2,
    text: 'Next, rewards meet truth pressure. When speed, fluency, or acceptability is easier to score than correction, performative alignment becomes locally rational.',
  });
  tl.tween(focusU, 0, { at: 14.2, dur: 0.5, ease: ease.move });
  tl.tween(focusRow, 1, { at: 14.7, dur: 0.4, ease: ease.move });
  tl.tween(focusU, 1, { at: 15.1, dur: 0.5, ease: ease.enter });
  tl.hold(20.1, 0.6);

  // Beat 3 — dissent is individually expensive.
  tl.caption({
    at: 20.7,
    dur: 6.1,
    text: 'Then individual risk meets collective correction. The person who slows down to verify pays now, while the benefit of being right arrives somewhere else and much later.',
  });
  tl.tween(focusU, 0, { at: 20.8, dur: 0.5, ease: ease.move });
  tl.tween(focusRow, 2, { at: 21.3, dur: 0.4, ease: ease.move });
  tl.tween(focusU, 1, { at: 21.7, dur: 0.5, ease: ease.enter });
  tl.hold(26.8, 0.6);

  // Beat 4 — provenance.
  tl.caption({
    at: 27.4,
    dur: 6.1,
    text: 'Signal integrity is the fourth pair. If source, instruction, commentary, and generated inference blur together, noise can travel as though it were a command.',
  });
  tl.tween(focusU, 0, { at: 27.5, dur: 0.5, ease: ease.move });
  tl.tween(focusRow, 3, { at: 28.0, dur: 0.4, ease: ease.move });
  tl.tween(focusU, 1, { at: 28.4, dur: 0.5, ease: ease.enter });
  tl.hold(33.5, 0.6);

  // Beat 5 — evaluation starts training the system.
  tl.caption({
    at: 34.1,
    dur: 6.2,
    text: 'Finally, evaluation can drift after outcomes are visible. A proxy that once observed the system begins to train it, and the score becomes the environment.',
  });
  tl.tween(focusU, 0, { at: 34.2, dur: 0.5, ease: ease.move });
  tl.tween(focusRow, 4, { at: 34.7, dur: 0.4, ease: ease.move });
  tl.tween(focusU, 1, { at: 35.1, dur: 0.5, ease: ease.enter });
  tl.hold(40.2, 0.6);

  // Beat 6 — coupling turns the ledger into a regime.
  tl.caption({
    at: 40.8,
    dur: 6.4,
    text: 'No single imbalance is enough. Incentive distortion raises the cost of dissent, weak dissent increases substitution, and degraded signals feed back into evaluation.',
  });
  tl.tween(cam, CAM_BALANCE, { at: 41.0, dur: 1.4, ease: ease.move });
  tl.tween(focusU, 0, { at: 41.1, dur: 0.5, ease: ease.move });
  tl.tween(modeU, 1, { at: 41.6, dur: 2.0, ease: ease.move });
  tl.tween(coupleU, 1, { at: 43.0, dur: 1.4, ease: ease.draw });
  tl.tween(glowU, 1, { at: 44.2, dur: 0.6, ease: ease.pop });
  tl.hold(47.8, 0.6);

  // Beat 7 — close on the shared preference.
  tl.caption({
    at: 48.4,
    dur: 6.5,
    text: 'Coupling is what makes a list of distortions into a propagating regime: the system learns that legible order is cheaper than reopening the frame.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 48.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 49.0, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.1, dur: 0.9, ease: ease.enter });
  tl.hold(55.8, 1.0);

  return { tl, cam, gridU, modeU, focusRow, focusU, coupleU, glowU, dimU, closeU };
}

const scene = buildScene();

function Balance({ mode, glow }: { mode: number; glow: number }) {
  const correction = lerp(0.86, 0.22, mode);
  const maintenance = lerp(0.22, 0.90, mode);
  const tilt = lerp(-14, 18, mode);
  return (
    <g transform={`translate(850 334) rotate(${tilt})`}>
      <circle r={178 + glow * 8} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={0.12 + glow * 0.2} />
      <line x1={-210} y1={0} x2={210} y2={0} stroke={colors.GRID} strokeWidth={8} strokeLinecap="round" />
      <circle r={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={3} />
      <path d="M0 28 L-18 90 L18 90 Z" fill={colors.WARM} opacity={0.8} />
      <g transform="translate(-150 -18)">
        <rect width={108} height={36} rx={10} fill={forceFill(maintenance, colors.NEGATIVE)} stroke={colors.NEGATIVE} strokeWidth={2} />
        <rect width={108 * maintenance} height={36} rx={10} fill={colors.NEGATIVE} opacity={0.7} />
        <text x={54} y={23} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>maintenance</text>
      </g>
      <g transform="translate(42 -18)">
        <rect width={108} height={36} rx={10} fill={forceFill(correction, colors.POSITIVE)} stroke={colors.POSITIVE} strokeWidth={2} />
        <rect width={108 * correction} height={36} rx={10} fill={colors.POSITIVE} opacity={0.7} />
        <text x={54} y={23} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>correction</text>
      </g>
      <text x={0} y={142} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} transform={`rotate(${-tilt})`}>
        {mode > 0.58 ? 'coherence theater' : 'workable equilibrium'}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const gridU = s.get(scene.gridU);
  const mode = s.get(scene.modeU);
  const row = Math.round(s.get(scene.focusRow));
  const focus = s.get(scene.focusU);
  const couple = s.get(scene.coupleU);
  const glow = s.get(scene.glowU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);
  const values = HEALTHY.map((r, i) => r.map((v, j) => lerp(v, THEATER[i][j], mode)));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        Five forces, one balance
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        the correction economy · Section 5
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <rect x={160} y={108} width={550} height={470} rx={26} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={190} y={145} fill={colors.TEXT} fontSize={16} fontWeight={700}>force ledger</text>
          <text x={190} y={169} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>left: maintenance pressure · right: correction capacity</text>
          <MatrixGrid
            x={330}
            y={210}
            values={values}
            cell={54}
            gap={10}
            cellU={(i, j) => clamp01(gridU * 12 - (i * 2 + j) - 1)}
            fill={(v, _i, j) => forceFill(v, j === 0 ? colors.NEGATIVE : colors.POSITIVE)}
            showValues={(v) => v.toFixed(1)}
            rowLabels={ROWS}
            colLabels={['maintenance', 'correction']}
            highlight={row >= 0 && row < ROWS.length ? { row, u: focus, color: colors.WARM } : undefined}
            labelSize={13}
          />
          <g opacity={couple}>
            <Vec x1={264} y1={238} x2={674} y2={238} grow={couple} color={colors.WARM} width={2} label="coupling" labelAt="mid" labelSize={11} />
            <Vec x1={264} y1={312} x2={674} y2={312} grow={couple} color={colors.WARM} width={2} label="feedback" labelAt="mid" labelSize={11} />
            <Vec x1={264} y1={386} x2={674} y2={386} grow={couple} color={colors.WARM} width={2} label="recirculation" labelAt="mid" labelSize={11} />
          </g>
          <text x={435} y={548} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={gridU}>five pairs, one shared preference</text>
          <Balance mode={mode} glow={glow} />
          <MathLabel tex={'\text{maintenance} - \text{correction}'} x={850} y={520} fontSize={20} color={colors.WARM} opacity={couple} />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={170} y={236} width={940} height={206} rx={28} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2.5} />
        <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>Coupling turns pressure into a regime</text>
        <text x={640} y={344} textAnchor="middle" fill={colors.WARM} fontSize={19}>when maintaining the story costs less than correcting it</text>
        <text x={640} y={384} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>the next chapter follows one artifact through the loop</text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
