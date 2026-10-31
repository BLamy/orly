import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  CLOUD_IDX,
  CURVE,
  FINAL,
  IS_LOOP,
  KL_MAX,
  NS,
  PEAK_IDX,
  RM,
  TRUE_Q,
  buildScene,
  chX,
  chY,
  cldX,
  cldY,
  klOf,
} from './scene';

/**
 * RLHF and Its Limits — pure render. The cloud and both curves are the real
 * best-of-n simulation from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/rlhf-overoptimization/overrides.json',
  slug: 'rlhf-overoptimization',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(key: 'proxy' | 'truth', upTo: number): string {
  const n = Math.max(2, Math.min(CURVE.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(CURVE[i].kl).toFixed(1)} ${chY(CURVE[i][key]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cloudU = s.get(scene.cloudU);
  const loopU = s.get(scene.loopU);
  const axU = s.get(scene.axU);
  const sweep = s.get(scene.sweep);
  const peakU = s.get(scene.peakU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);
  const mathU = s.get(scene.mathU);

  const si = Math.max(0, Math.min(CURVE.length - 1, sweep));
  const iNow = Math.min(CURVE.length - 1, Math.round(si));
  const now = CURVE[iNow];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the candidate cloud: fades out as the camera turns to the curves */}
          {axU < 1 && (
            <g opacity={1 - axU}>
              {CLOUD_IDX.map((i, k) => {
                const u = clamp01(cloudU * 1.5 - k / CLOUD_IDX.length);
                if (u <= 0) return null;
                const loop = IS_LOOP[i];
                return (
                  <circle
                    key={i}
                    cx={cldX(TRUE_Q[i])}
                    cy={cldY(RM[i])}
                    r={loop && loopU > 0 ? 4.5 : 2.5}
                    fill={loop && loopU > 0 ? colors.NEGATIVE : colors.ACCENT}
                    opacity={u * (loop && loopU > 0 ? 0.95 : 0.4)}
                  />
                );
              })}
              <g opacity={cloudU}>
                <text x={cldX(0.5)} y={502} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  true quality →
                </text>
                <text x={86} y={310} textAnchor="middle" fill={colors.MUTED} fontSize={14} transform="rotate(-90 86 310)">
                  reward model score →
                </text>
              </g>
              {loopU > 0.5 && (
                <text x={cldX(0.5)} y={118} fill={colors.NEGATIVE} fontSize={14} opacity={loopU}>
                  the loopholes: low quality, high score
                </text>
              )}
            </g>
          )}

          {/* the curves */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(KL_MAX) + 10} y2={CH_Y0} stroke={colors.GRID} />
              {NS.filter((n) => n === 1 || n === 8 || n === 64 || n === 1024).map((n) => (
                <text key={n} x={chX(klOf(n))} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  {`n = ${n}`}
                </text>
              ))}
              <text x={chX(KL_MAX / 2)} y={CH_Y0 + 44} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                optimization pressure (KL from base policy) →
              </text>
            </g>
          )}
          {sweep > 0 && (
            <g>
              <path d={curvePath('proxy', si)} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
              <path d={curvePath('truth', si)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(now.kl)} cy={chY(now.proxy)} r={5} fill={colors.ACCENT} />
              <circle cx={chX(now.kl)} cy={chY(now.truth)} r={5} fill={colors.POSITIVE} />
              <text x={chX(now.kl) + 10} y={chY(now.proxy) - 8} fill={colors.ACCENT} fontSize={14}>
                {`reward model: ${now.proxy.toFixed(2)}`}
              </text>
              <text x={chX(now.kl) + 10} y={chY(now.truth) + 20} fill={colors.POSITIVE} fontSize={14}>
                {`true quality: ${now.truth.toFixed(2)}`}
              </text>
              <text x={CH_X0} y={CH_Y0 + 72} fill={colors.TEXT} fontSize={14}>
                {`best of n = ${now.n} · loopholes chosen: ${(now.loopFrac * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {peakU > 0 && (
            <g opacity={peakU}>
              <circle cx={chX(CURVE[PEAK_IDX].kl)} cy={chY(CURVE[PEAK_IDX].truth)} r={9} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
              <text x={chX(CURVE[PEAK_IDX].kl)} y={chY(CURVE[PEAK_IDX].truth) - 16} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                {`peak: ${CURVE[PEAK_IDX].truth.toFixed(2)}`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed formula (plain text: the MathLabel rendered twice here) */}
      {mathU > 0 && (
        <text x={1220} y={70} textAnchor="end" fill={colors.WARM} fontSize={19} opacity={mathU}>
          KL(n) = ln n − (n−1)/n
        </text>
      )}

      {/* clean ending card: solid panel over an empty stage */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Reward-Model Overoptimization
          </text>
          <text x={640} y={340} textAnchor="middle" fontSize={22}>
            <tspan fill={colors.ACCENT}>{`proxy ↑ ${FINAL.proxy.toFixed(2)}`}</tspan>
            <tspan fill={colors.TEXT}>{'      '}</tspan>
            <tspan fill={colors.POSITIVE}>{`truth: 0.75 → ${FINAL.truth.toFixed(2)}`}</tspan>
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            a learned judge is accurate near its data and exploitable far from it
          </text>
        </g>
      )}
    </>
  );
}

export function RlhfOveroptimization() {
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
