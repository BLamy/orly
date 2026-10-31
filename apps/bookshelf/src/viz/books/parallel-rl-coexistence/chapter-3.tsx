// The Geometry of Coexistence - chapter 3: Advantage Leaves Only the Residual.
//
// Grounded in arXiv:2608.03573 Sections 4.2-4.4, Figure 3, Table 3, and
// Theorem 4.5, plus src/parallel_rl/score_function_stats.py and
// configs/paper_defaults.yaml. The sixteen-vector bouquet is a deterministic
// schematic of the configured sixteen rollouts; aggregate labels use paper data.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Vec } from '../../primitives';

const N = 16;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
// The bouquet is centred on the group mean (MEAN_X, MEAN_Y) from the prompt origin.
const S = 1.35;
const MEAN_X = 138;
const MEAN_Y = -28;
const ROLLOUTS = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * Math.PI * 2;
  const r = (28 + (i % 4) * 9) * S;
  return { x: Math.cos(a) * r + MEAN_X, y: Math.sin(a) * r + MEAN_Y, reward: i % 3 === 0 ? 1 : 0 };
});

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const promptU = tl.channel('promptU', 0);
  const rolloutsU = tl.channel('rolloutsU', 0);
  const meanU = tl.channel('meanU', 0);
  const residualU = tl.channel('residualU', 0);
  const boundsU = tl.channel('boundsU', 0);
  const normU = tl.channel('normU', 0);
  const secondTaskU = tl.channel('secondTaskU', 0);
  const separateU = tl.channel('separateU', 0);
  const warningU = tl.channel('warningU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.5, text: 'For one prompt, group-relative policy optimization samples sixteen answers from the current model.' });
  tl.tween(promptU, 1, { at: 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(rolloutsU, 1, { at: 1.7, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 430, y: 340, k: 1.12 }, { at: 2.2, dur: 1.3, ease: ease.move });
  tl.hold(7.0, 0.8);

  tl.caption({ at: 7.8, dur: 6.5, text: 'Their score vectors share a broad direction. Average the group and that common arrow becomes visible.' });
  tl.tween(meanU, 1, { at: 8.4, dur: 1.4, ease: ease.draw });
  tl.hold(14.3, 0.8);

  tl.caption({ at: 15.1, dur: 6.8, text: 'Advantage normalization subtracts what the group shares, then rewards better trajectories and suppresses worse ones.' });
  tl.tween(residualU, 1, { at: 15.7, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 430, y: 350, k: 1.2 }, { at: 17.0, dur: 1.3, ease: ease.move });
  tl.hold(21.9, 0.8);

  tl.caption({ at: 22.7, dur: 6.8, text: 'The shared direction cancels. What drives the update is the much smaller cloud of within-group residuals.' });
  tl.hold(29.5, 0.8);

  tl.caption({ at: 30.3, dur: 6.8, text: 'That changes the interference bound: supervision is limited by absolute score norm, but reinforcement learning is limited by residual variance.' });
  tl.tween(boundsU, 1, { at: 30.9, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 32.0, dur: 1.3, ease: ease.move });
  tl.hold(37.1, 0.8);

  tl.caption({ at: 37.9, dur: 6.8, text: 'The paper measures about seven point one for the supervised score norm, versus about one hundredth for the reinforcement residual.' });
  tl.tween(normU, 1, { at: 38.5, dur: 1.6, ease: ease.move });
  tl.hold(44.7, 0.8);

  tl.caption({ at: 45.5, dur: 6.8, text: 'Repeat the process for another task and the residual clouds separate, reducing cross-task overlap.' });
  tl.tween(secondTaskU, 1, { at: 46.1, dur: 1.0, ease: ease.enter });
  tl.tween(separateU, 1, { at: 47.2, dur: 1.8, ease: ease.move });
  tl.hold(52.3, 0.8);

  tl.caption({ at: 53.1, dur: 6.8, text: 'This is a bound, not a promise. The appendix shows that poorly matched tasks can still interfere.' });
  tl.tween(warningU, 1, { at: 53.7, dur: 0.7, ease: ease.enter });
  tl.hold(59.9, 0.8);

  tl.caption({ at: 60.7, dur: 7.0, text: 'For compatible tasks, on-policy sampling and advantage weighting leave small residual directions that are easier to combine.' });
  tl.tween(dimU, 1, { at: 61.3, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 62.2, dur: 0.7, ease: ease.enter });
  tl.hold(67.7, 1.0);

  return { tl, cam, promptU, rolloutsU, meanU, residualU, boundsU, normU, secondTaskU, separateU, warningU, dimU, endU };
}

const scene = buildScene();

function Bouquet({ cx, cy, u, residual, color, opacity = 1 }: { cx: number; cy: number; u: number; residual: number; color: string; opacity?: number }) {
  return <g opacity={opacity}>
    {ROLLOUTS.map((p, i) => {
      const stagger = clamp01(u * 1.8 - i / N * 0.8);
      const fullX = cx + p.x;
      const fullY = cy + p.y;
      const residualX = cx + (p.x - MEAN_X) * 1.15;
      const residualY = cy + (p.y - MEAN_Y) * 1.15;
      const x = lerp(fullX, residualX, residual);
      const y = lerp(fullY, residualY, residual);
      return <g key={i} opacity={stagger}>
        <line x1={cx} y1={cy} x2={x} y2={y} stroke={p.reward ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={2} opacity={0.28 + residual * 0.32} />
        <circle cx={x} cy={y} r={6 + p.reward * 2} fill={p.reward ? colors.POSITIVE : color} />
      </g>;
    })}
    <circle cx={cx} cy={cy} r={9} fill={color} />
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const residual = clamp01(s.get(scene.residualU));
  const sep = clamp01(s.get(scene.separateU));
  // Old content fades to 0.15 or below once the closing panel arrives, so no faded labels show around it.
  const dim = (1 - 0.9 * s.get(scene.dimU)) * (1 - 0.85 * s.get(scene.endU));
  const mathX = lerp(430, 350, sep);
  const scienceX = lerp(430, 700, sep);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={850}>Advantage leaves only the residual</text>
      <text x={640} y={78} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>score_function_stats.py · num_rollouts: 16</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <g opacity={s.get(scene.promptU)}>
          <rect x={30} y={270} width={200} height={150} rx={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={130} y={302} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>one prompt group</text>
          <text x={130} y={336} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={800}>16 rollouts</text>
          <text x={130} y={364} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={0.85}>grade each answer</text>
          <text x={130} y={384} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={0.85}>against the class average</text>
        </g>
        <Bouquet cx={mathX} cy={350} u={s.get(scene.rolloutsU)} residual={residual} color={colors.ACCENT} />
        <text x={mathX} y={508} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily={MONO}>math score vectors</text>
        <Vec x1={mathX} y1={350} x2={mathX + lerp(MEAN_X, 0, residual)} y2={350 + lerp(MEAN_Y, 0, residual)} grow={s.get(scene.meanU)} color={colors.WARM} width={5} />
        <text x={mathX + MEAN_X} y={232} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO} opacity={s.get(scene.meanU) * (1 - residual)}>group mean = class average</text>
        <g opacity={s.get(scene.secondTaskU)}>
          <Bouquet cx={scienceX} cy={350} u={1} residual={residual} color={colors.SECONDARY} opacity={0.9} />
          <text x={scienceX} y={508} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontFamily={MONO}>science score vectors</text>
        </g>
        <g opacity={s.get(scene.boundsU)}>
          <rect x={790} y={160} width={400} height={238} rx={22} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={990} y={198} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={800}>interference upper bounds</text>
          <text x={990} y={252} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20} fontFamily={MONO}>|I<tspan baselineShift="sub" fontSize={14}>SFT</tspan>(i,j)| ≤ M<tspan baselineShift="sub" fontSize={14}>i</tspan> M<tspan baselineShift="sub" fontSize={14}>j</tspan></text>
          <text x={990} y={326} textAnchor="middle" fill={colors.POSITIVE} fontSize={20} fontFamily={MONO}>|I<tspan baselineShift="sub" fontSize={14}>RL</tspan>(i,j)| ≤ V<tspan baselineShift="sub" fontSize={14}>i</tspan> V<tspan baselineShift="sub" fontSize={14}>j</tspan></text>
          <text x={990} y={372} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={0.85}>absolute norm vs. within-group variance</text>
        </g>
        <g opacity={s.get(scene.normU)}>
          <rect x={810} y={432} width={170} height={112} rx={18} fill={colors.NEGATIVE} opacity={0.13} />
          <text x={895} y={468} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>SFT ‖S‖₂</text>
          <text x={895} y={516} textAnchor="middle" fill={colors.NEGATIVE} fontSize={34} fontFamily={MONO}>≈ 7.1</text>
          <rect x={1000} y={432} width={170} height={112} rx={18} fill={colors.POSITIVE} opacity={0.13} />
          <text x={1085} y={468} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>RL ‖δS‖₂</text>
          <text x={1085} y={516} textAnchor="middle" fill={colors.POSITIVE} fontSize={34} fontFamily={MONO}>≈ 10⁻²</text>
        </g>
        <g opacity={s.get(scene.warningU)}>
          <rect x={790} y={572} width={400} height={48} rx={14} fill={colors.WARM} opacity={0.14} />
          <text x={990} y={602} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO}>task selection still matters · Appendix D</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={170} y={224} width={940} height={216} rx={28} fill={colors.BG} />
      <rect x={170} y={224} width={940} height={216} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={850}>Subtract the shared direction</text>
      <text x={640} y={348} textAnchor="middle" fill={colors.POSITIVE} fontSize={21}>optimize the small within-group residual</text>
      <text x={640} y={394} textAnchor="middle" fill={colors.MUTED} fontSize={15}>variance-limited interference</text>
    </g>
  </>;
}

export const vizScene = () => scene;
