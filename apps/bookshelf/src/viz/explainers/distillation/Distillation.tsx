import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BARS_Y,
  BAR_MAX,
  BAR_W,
  CLASSES,
  HARD_TRAJ,
  P_T1,
  P_T2,
  P_T4,
  SOFT_TRAJ,
  S_X0,
  T_X0,
  barX,
  buildScene,
  trajAt,
} from './scene';

/**
 * Distillation — pure render. The teacher's temperature curves and both
 * student trajectories are the real softmax/gradient-descent computations
 * from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/distillation/overrides.json', slug: 'distillation' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Teacher distribution at tempU ∈ [0,1]: T=1 → T=2 → T=4, piecewise lerp. */
function teacherDist(tempU: number): number[] {
  const u = clamp01(tempU);
  if (u < 0.5) {
    const t = u * 2;
    return P_T1.map((v, i) => v + (P_T2[i] - v) * t);
  }
  const t = (u - 0.5) * 2;
  return P_T2.map((v, i) => v + (P_T4[i] - v) * t);
}

function Bars({
  dist,
  x0,
  color,
  reveal,
  darkU = 0,
  labels = true,
}: {
  dist: number[];
  x0: number;
  color: string;
  reveal: number;
  darkU?: number;
  labels?: boolean;
}) {
  return (
    <g>
      {dist.map((p, i) => {
        const u = clamp01(reveal * CLASSES.length - i);
        if (u <= 0) return null;
        const h = p * BAR_MAX * u;
        const dark = i === 1 || i === 2; // wolf, coyote
        return (
          <g key={i} opacity={u}>
            <rect
              x={barX(x0, i)}
              y={BARS_Y - h}
              width={BAR_W}
              height={Math.max(1.5, h)}
              rx={5}
              fill={dark && darkU > 0.3 ? colors.WARM : color}
              opacity={0.88}
            />
            <text x={barX(x0, i) + BAR_W / 2} y={BARS_Y - h - 8} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
              {(p * 100).toFixed(p >= 0.1 ? 0 : 1)}%
            </text>
            {labels && (
              <text x={barX(x0, i) + BAR_W / 2} y={BARS_Y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                {CLASSES[i]}
              </text>
            )}
          </g>
        );
      })}
      <line x1={x0 - 8} y1={BARS_Y} x2={x0 + CLASSES.length * (BAR_W + 14) - 8} y2={BARS_Y} stroke={colors.GRID} />
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const teachU = s.get(scene.teachU);
  const tempU = s.get(scene.tempU);
  const darkU = s.get(scene.darkU);
  const studU = s.get(scene.studU);
  const softProg = s.get(scene.softProg);
  const hardProg = s.get(scene.hardProg);
  const showHard = s.get(scene.showHard);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const teacher = teacherDist(tempU);
  const T_now = tempU < 0.5 ? 1 + tempU * 2 : 2 + (tempU - 0.5) * 4;
  const soft = trajAt(SOFT_TRAJ, softProg);
  const hard = trajAt(HARD_TRAJ, hardProg);
  const softSteps = Math.round((softProg / (SOFT_TRAJ.length - 1)) * 400);
  const hardSteps = Math.round((hardProg / (HARD_TRAJ.length - 1)) * 400);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* teacher */}
          <g opacity={teachU}>
            <text x={T_X0} y={110} fill={colors.TEXT} fontSize={17} fontWeight={600}>
              teacher
            </text>
            <text x={T_X0 + 82} y={110} fill={colors.MUTED} fontSize={14}>
              {`temperature ${T_now.toFixed(1)}`}
            </text>
          </g>
          {teachU > 0 && <Bars dist={teacher} x0={T_X0} color={colors.ACCENT} reveal={teachU} darkU={darkU} />}
          {darkU > 0.3 && (
            <text x={T_X0 + 100} y={150} fill={colors.WARM} fontSize={14} opacity={darkU}>
              the dark knowledge: this dog is wolf-shaped
            </text>
          )}

          {/* student */}
          {studU > 0 && (
            <g opacity={studU}>
              <text x={S_X0} y={110} fill={colors.TEXT} fontSize={17} fontWeight={600}>
                student
              </text>
              <text x={S_X0 + 82} y={110} fill={showHard > 0.5 ? colors.NEGATIVE : colors.POSITIVE} fontSize={14}>
                {showHard > 0.5
                  ? `hard label — step ${hardSteps} of 400`
                  : `soft targets — step ${softSteps} of 400`}
              </text>
              <Bars
                dist={showHard > 0.5 ? hard : soft}
                x0={S_X0}
                color={showHard > 0.5 ? colors.NEGATIVE : colors.POSITIVE}
                reveal={1}
              />
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'p_i = \\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}'}
        x={1080}
        y={72}
        fontSize={21}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Distillation
          </text>
          <MathLabel
            tex={'\\mathcal{L} = \\mathrm{KL}\\big(p_{\\text{teacher}}^{(T)} \\,\\|\\, p_{\\text{student}}^{(T)}\\big)'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.POSITIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            train on the thinking, not the verdict — the student inherits the similarity map
          </text>
        </g>
      )}
    </>
  );
}

export function Distillation() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
