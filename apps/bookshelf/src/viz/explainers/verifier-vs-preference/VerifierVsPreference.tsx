import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  CLOUD_IDX,
  COR,
  CURVE,
  FINAL,
  FLU,
  LOOP,
  NS,
  PEAK_IDX,
  PREF,
  buildScene,
  chX,
  chY,
  cldX,
  cldY,
} from './scene';

/**
 * Verifier vs Preference — pure render. Cloud + both best-of-n curves are the
 * real simulation from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/verifier-vs-preference/overrides.json',
  slug: 'verifier-vs-preference',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(key: 'proxy' | 'verif', upTo: number): string {
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
  const corU = s.get(scene.corU);
  const loopU = s.get(scene.loopU);
  const axU = s.get(scene.axU);
  const sweepP = s.get(scene.sweepP);
  const sweepV = s.get(scene.sweepV);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const siP = Math.max(0, Math.min(CURVE.length - 1, sweepP));
  const siV = Math.max(0, Math.min(CURVE.length - 1, sweepV));
  const nowP = CURVE[Math.min(CURVE.length - 1, Math.round(siP))];
  const nowV = CURVE[Math.min(CURVE.length - 1, Math.round(siV))];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* candidate cloud */}
          {CLOUD_IDX.map((i, k) => {
            const u = clamp01(cloudU * 1.5 - k / CLOUD_IDX.length);
            if (u <= 0) return null;
            const loop = LOOP[i];
            const hot = loop && loopU > 0;
            const fill = hot
              ? colors.NEGATIVE
              : corU > 0 && COR[i]
                ? colors.POSITIVE
                : colors.MUTED;
            return (
              <circle
                key={i}
                cx={cldX(FLU[i])}
                cy={cldY(PREF[i])}
                r={hot ? 4.5 : 2.5}
                fill={fill}
                opacity={u * (hot ? 0.95 : COR[i] ? 0.55 : 0.3)}
              />
            );
          })}
          <g opacity={cloudU}>
            <text x={cldX(0.5)} y={550} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              fluency / confidence →
            </text>
            <text x={94} y={315} textAnchor="middle" fill={colors.MUTED} fontSize={13} transform="rotate(-90 94 315)">
              preference score →
            </text>
          </g>
          {corU > 0.4 && (
            <text x={cldX(0.06)} y={92} fill={colors.POSITIVE} fontSize={13.5} opacity={corU}>
              green: actually passes the tests (38%)
            </text>
          )}
          {loopU > 0.5 && (
            <text x={cldX(0.2)} y={124} fill={colors.NEGATIVE} fontSize={13.5} opacity={loopU}>
              confident nonsense: wrong, loved by the judge
            </text>
          )}

          {/* accuracy vs n */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(NS.length - 1) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.02)} stroke={colors.GRID} />
              {NS.map((n, i) => (
                <text key={n} x={chX(i)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {n}
                </text>
              ))}
              <text x={chX(4)} y={CH_Y0 + 42} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                n samples (optimization pressure) →
              </text>
              <text x={CH_X0 - 20} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                1.0
              </text>
              <text x={CH_X0 - 20} y={chY(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                0
              </text>
            </g>
          )}
          {sweepP > 0 && (
            <g>
              <path d={curvePath('proxy', siP)} fill="none" stroke={colors.WARM} strokeWidth={3} />
              <circle cx={chX(siP)} cy={chY(nowP.proxy)} r={5} fill={colors.WARM} />
              <text x={chX(siP) + 10} y={chY(nowP.proxy) - 10} fill={colors.WARM} fontSize={13}>
                {`preference picks: ${nowP.proxy.toFixed(2)}`}
              </text>
              {sweepP > 2.5 && (
                <g opacity={clamp01(sweepP - 2.5)}>
                  <circle cx={chX(PEAK_IDX)} cy={chY(CURVE[PEAK_IDX].proxy)} r={9} fill="none" stroke={colors.WARM} strokeWidth={2} />
                </g>
              )}
              <text x={CH_X0} y={CH_Y0 + 64} fill={colors.MUTED} fontSize={13}>
                {`loophole wins: ${(nowP.loopFrac * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {sweepV > 0 && (
            <g>
              <path d={curvePath('verif', siV)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(siV)} cy={chY(nowV.verif)} r={5} fill={colors.POSITIVE} />
              <text x={chX(siV) - 10} y={chY(nowV.verif) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                {`verifier picks: ${nowV.verif.toFixed(2)}`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'P(\\text{correct}) = 1-(1-p)^n'}
        x={1050}
        y={70}
        fontSize={19}
        color={colors.POSITIVE}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Verifiable Rewards
          </text>
          <MathLabel
            tex={`\\text{preference}: 0.62 \\to ${FINAL.proxy.toFixed(2)} \\qquad \\text{verifier}: \\to ${FINAL.verif.toFixed(2)}`}
            x={640}
            y={340}
            fontSize={20}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            you cannot sweet-talk a test suite
          </text>
        </g>
      )}
    </>
  );
}

export function VerifierVsPreference() {
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
