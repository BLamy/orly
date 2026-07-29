import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CURVE_11,
  CURVE_3,
  LEAK_IDX,
  MSE_FRESH_11,
  MSE_FRESH_3,
  MSE_TRAIN_3,
  N_PLOT,
  XF,
  XT,
  X_MAX,
  X_MIN,
  YF,
  YT,
  buildScene,
  px,
  py,
} from './scene';

/**
 * Train/Test Contamination — pure render. Both fits and every error number
 * come from the real least-squares solutions in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/contamination/overrides.json', slug: 'contamination' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(ys: number[], reveal: number): string {
  const n = Math.max(2, Math.ceil(reveal * N_PLOT));
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1);
    d += `${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)} ${py(ys[i]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ptsU = s.get(scene.ptsU);
  const fitU = s.get(scene.fitU);
  const leakU = s.get(scene.leakU);
  const freshU = s.get(scene.freshU);
  const honestU = s.get(scene.honestU);
  const boardU = s.get(scene.boardU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* axis */}
          <line x1={px(X_MIN)} y1={py(0)} x2={px(X_MAX)} y2={py(0)} stroke={colors.GRID} opacity={ptsU} />

          {/* memorizer curve */}
          {fitU > 0 && <path d={curvePath(CURVE_11, fitU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} opacity={0.9} />}
          {fitU > 0.9 && (
            <text x={px(X_MIN) + 4} y={py(0) - 148} fill={colors.NEGATIVE} fontSize={14} opacity={clamp01((fitU - 0.9) * 10)}>
              the memorizer — 12 knobs, train error 4e-18
            </text>
          )}

          {/* honest curve */}
          {honestU > 0 && <path d={curvePath(CURVE_3, honestU)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={0.9} />}
          {honestU > 0.9 && (
            <text x={px(1.0)} y={py(-1.5)} fill={colors.POSITIVE} fontSize={14} opacity={clamp01((honestU - 0.9) * 10)}>
              the honest model — 4 knobs
            </text>
          )}

          {/* train points (leaked ones get a ring) */}
          {XT.map((x, i) => {
            const u = clamp01(ptsU * 12 - i);
            if (u <= 0) return null;
            const leaked = LEAK_IDX.includes(i) && leakU > 0;
            return (
              <g key={i} opacity={u}>
                <circle cx={px(x)} cy={py(YT[i])} r={5.5} fill={colors.ACCENT} opacity={0.95} />
                {leaked && (
                  <circle cx={px(x)} cy={py(YT[i])} r={11} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={leakU} />
                )}
              </g>
            );
          })}
          {leakU > 0.5 && (
            <text x={px(-1.2)} y={py(2.05)} fill={colors.WARM} fontSize={14} opacity={leakU}>
              ringed points leaked into the benchmark
            </text>
          )}

          {/* fresh points */}
          {freshU > 0 &&
            XF.map((x, i) => (
              <circle
                key={i}
                cx={px(x)}
                cy={py(YF[i])}
                r={4}
                fill={colors.SECONDARY}
                opacity={0.9 * clamp01(freshU * 24 - i)}
              />
            ))}
          {freshU > 0.9 && (
            <text x={px(-1.9)} y={py(-1.85)} fill={colors.SECONDARY} fontSize={14} opacity={freshU}>
              fresh questions — never seen
            </text>
          )}
        </g>
      </Camera>

      {/* scoreboard */}
      {boardU > 0 && (
        <g opacity={boardU * dimU}>
          <rect x={935} y={120} width={296} height={freshU > 0.3 ? (honestU > 0.3 ? 262 : 208) : 148} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={958} y={152} fill={colors.TEXT} fontSize={16} fontWeight={650}>
            the scoreboard
          </text>
          <text x={958} y={186} fill={colors.NEGATIVE} fontSize={14.5}>
            memorizer, leaked test:
          </text>
          <text x={958} y={208} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
            error 0.000 — “perfect”
          </text>
          {freshU > 0.3 && (
            <g opacity={freshU}>
              <text x={958} y={242} fill={colors.SECONDARY} fontSize={14.5}>
                memorizer, fresh test:
              </text>
              <text x={958} y={264} fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                {`error ${MSE_FRESH_11.toFixed(2)}`}
              </text>
            </g>
          )}
          {honestU > 0.3 && (
            <g opacity={honestU}>
              <text x={958} y={298} fill={colors.POSITIVE} fontSize={14.5}>
                honest model, train / fresh:
              </text>
              <text x={958} y={320} fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                {`${MSE_TRAIN_3.toFixed(3)} / ${MSE_FRESH_3.toFixed(3)}`}
              </text>
            </g>
          )}
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Contamination
          </text>
          <MathLabel
            tex={'\\text{score}_{\\text{leaked}} = 0 \\qquad \\text{score}_{\\text{fresh}} = 3.74'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            skill travels to new questions — memorization does not
          </text>
        </g>
      )}
    </>
  );
}

export function Contamination() {
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
