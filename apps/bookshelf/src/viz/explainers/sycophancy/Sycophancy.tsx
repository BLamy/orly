import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  A_SCORE,
  CH_X0,
  CH_Y0,
  CLOUD_IDX,
  CURVE,
  FINAL,
  MIN_TRUTH,
  NS,
  T_SCORE,
  buildScene,
  chX,
  chY,
  clX,
  clY,
} from './scene';

/**
 * Sycophancy — pure render. The cloud and every curve come from the real
 * best-of-n simulation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/sycophancy/overrides.json', slug: 'sycophancy' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(key: 'truth' | 'agree' | 'approval' | 'truthHonest', upTo: number): string {
  const n = Math.max(2, Math.min(CURVE.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(CURVE[i][key]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cloudU = s.get(scene.cloudU);
  const axU = s.get(scene.axU);
  const sweep = s.get(scene.sweep);
  const honestU = s.get(scene.honestU);
  const pickU = s.get(scene.pickU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const si = Math.max(0, Math.min(CURVE.length - 1, sweep));
  const now = CURVE[Math.min(CURVE.length - 1, Math.round(si))];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the answer cloud */}
          {CLOUD_IDX.map((i, k) => {
            const u = clamp01(cloudU * 1.5 - k / CLOUD_IDX.length);
            if (u <= 0) return null;
            // once optimizing, highlight the flattering corner it selects from
            const hot = pickU > 0 && A_SCORE[i] > 0.82;
            return (
              <circle
                key={i}
                cx={clX(T_SCORE[i])}
                cy={clY(A_SCORE[i])}
                r={hot ? 3.5 : 2.5}
                fill={hot ? colors.NEGATIVE : colors.ACCENT}
                opacity={u * (hot ? 0.85 : 0.4)}
              />
            );
          })}
          <g opacity={cloudU}>
            <text x={clX(0.5)} y={548} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              truthfulness →
            </text>
            <text x={92} y={320} textAnchor="middle" fill={colors.MUTED} fontSize={13} transform="rotate(-90 92 320)">
              agrees with the user →
            </text>
          </g>
          {pickU > 0.5 && (
            <text x={clX(0.05)} y={150} fill={colors.NEGATIVE} fontSize={13.5} opacity={pickU}>
              where approval shops
            </text>
          )}

          {/* the curves */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(NS.length - 1) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <text x={chX(3.5)} y={CH_Y0 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                optimization pressure (best of n) →
              </text>
            </g>
          )}
          {sweep > 0 && (
            <g>
              <path d={curvePath('approval', si)} fill="none" stroke={colors.WARM} strokeWidth={3} />
              <path d={curvePath('agree', si)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
              <path d={curvePath('truth', si)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <text x={chX(si) + 10} y={chY(now.approval)} fill={colors.WARM} fontSize={13}>
                {`approval ${now.approval.toFixed(2)}`}
              </text>
              <text x={chX(si) + 10} y={chY(now.agree) - 12} fill={colors.NEGATIVE} fontSize={13}>
                {`agreement ${now.agree.toFixed(2)}`}
              </text>
              <text x={chX(si) + 10} y={chY(now.truth) + 20} fill={colors.POSITIVE} fontSize={13}>
                {`truth ${now.truth.toFixed(2)}`}
              </text>
            </g>
          )}
          {honestU > 0 && (
            <g opacity={honestU}>
              <path d={curvePath('truthHonest', honestU * (CURVE.length - 1))} fill="none" stroke={colors.POSITIVE} strokeWidth={3} strokeDasharray="8 6" />
              <text x={chX(NS.length - 1) - 190} y={chY(CURVE[CURVE.length - 1].truthHonest) - 12} fill={colors.POSITIVE} fontSize={13}>
                {`truth-first judge: ${CURVE[CURVE.length - 1].truthHonest.toFixed(2)}`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Sycophancy
          </text>
          <MathLabel
            tex={`\\text{approval} \\uparrow ${FINAL.approval.toFixed(2)} \\quad \\text{truth} \\downarrow ${MIN_TRUTH.toFixed(2)} \\quad \\text{truth-first judge}: ${FINAL.truthHonest.toFixed(2)}`}
            x={640}
            y={340}
            fontSize={18}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            sycophancy is a property of the evaluation, not the model
          </text>
        </g>
      )}
    </>
  );
}

export function Sycophancy() {
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
