import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BIG,
  BIG_AT_1,
  CH_X0,
  CH_Y0,
  NS,
  REPORTED,
  REP_DY,
  REP_W,
  REP_X,
  REP_Y0,
  SMALL,
  SMALL_AT_8,
  buildScene,
  chX,
  chY,
} from './scene';
import type { Pt } from './scene';

/**
 * The New Scaling Law — pure render. Reported panels are replotted published
 * numbers (labeled); the compute-trade curves are the toy suite, computed.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/test-time-scaling/overrides.json',
  slug: 'test-time-scaling',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(pts: Pt[], upTo: number): string {
  const n = Math.max(2, Math.min(pts.length, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(pts[i].cost).toFixed(1)} ${chY(pts[i].acc).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const repU = s.get(scene.repU);
  const axU = s.get(scene.axU);
  const sweepB = s.get(scene.sweepB);
  const sweepS = s.get(scene.sweepS);
  const crossU = s.get(scene.crossU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const siB = Math.max(0, Math.min(BIG.length - 1, sweepB));
  const siS = Math.max(0, Math.min(SMALL.length - 1, sweepS));
  const nowB = BIG[Math.min(BIG.length - 1, Math.round(siB))];
  const nowS = SMALL[Math.min(SMALL.length - 1, Math.round(siS))];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* reported panels (whisper once the toy chart takes over) */}
          <g opacity={Math.max(0.12, 1 - 0.9 * axU)}>
            {REPORTED.map((r, i) => {
              const u = clamp01(repU * 1.5 - i * 0.2);
              if (u <= 0) return null;
              const y0 = REP_Y0 + i * REP_DY;
              const barW = (v: number): number => v * (REP_W - 40);
              return (
                <g key={r.name} opacity={u}>
                  <rect x={REP_X - 20} y={y0 - 34} width={REP_W + 40} height={150} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={REP_X} y={y0 - 8} fill={colors.TEXT} fontSize={13.5} fontWeight={630}>
                    {r.name}
                  </text>
                  <rect x={REP_X} y={y0 + 10} width={barW(r.from)} height={18} rx={4} fill={colors.MUTED} opacity={0.6} />
                  <text x={REP_X + barW(r.from) + 8} y={y0 + 24} fill={colors.MUTED} fontSize={12}>
                    {`${(r.from * 100).toFixed(1)}% · 1 sample`}
                  </text>
                  <rect x={REP_X} y={y0 + 38} width={barW(r.to)} height={18} rx={4} fill={colors.ACCENT} opacity={0.85} />
                  <text x={REP_X + barW(r.to) + 8} y={y0 + 52} fill={colors.ACCENT} fontSize={12}>
                    {`${(r.to * 100).toFixed(0)}% · ${r.at}`}
                  </text>
                  <text x={REP_X} y={y0 + 86} fill={colors.WARM} fontSize={11.5} fontStyle="italic">
                    {r.src}
                  </text>
                </g>
              );
            })}
          </g>

          {/* the toy compute chart */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(1280) + 8} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.0)} stroke={colors.GRID} />
              {[1, 10, 100, 1000].map((c) => (
                <text key={c} x={chX(c)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {c}
                </text>
              ))}
              <text x={chX(40)} y={CH_Y0 + 44} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                total compute per answer (log scale) →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                1.0
              </text>
              <text x={CH_X0 - 18} y={chY(0.5) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                0.5
              </text>
              <text x={chX(40)} y={chY(1.0) - 12} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                toy suite · verified best-of-N · computed
              </text>
            </g>
          )}
          {sweepB > 0 && (
            <g>
              <path d={curvePath(BIG, siB)} fill="none" stroke={colors.WARM} strokeWidth={3} />
              <circle cx={chX(nowB.cost)} cy={chY(nowB.acc)} r={5} fill={colors.WARM} />
              <text x={chX(nowB.cost) + 8} y={chY(nowB.acc) + 20} fill={colors.WARM} fontSize={12.5}>
                {`big model: ${(nowB.acc * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {sweepS > 0 && (
            <g>
              <path d={curvePath(SMALL, siS)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(nowS.cost)} cy={chY(nowS.acc)} r={5} fill={colors.POSITIVE} />
              <text x={chX(nowS.cost) - 8} y={chY(nowS.acc) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={12.5}>
                {`small + verifier: ${(nowS.acc * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {crossU > 0 && (
            <g opacity={crossU}>
              <line x1={chX(10)} y1={chY(1.0)} x2={chX(10)} y2={CH_Y0} stroke={colors.SECONDARY} strokeDasharray="5 5" strokeWidth={1.6} />
              <circle cx={chX(BIG_AT_1.cost)} cy={chY(BIG_AT_1.acc)} r={8} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} />
              <circle cx={chX(SMALL_AT_8.cost)} cy={chY(SMALL_AT_8.acc)} r={8} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} />
              <text x={chX(10) + 8} y={chY(0.995)} fill={colors.SECONDARY} fontSize={12.5}>
                same budget: 90% vs 75%
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={210} y={200} width={860} height={248} rx={16} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The New Scaling Law
          </text>
          <MathLabel
            tex={'\\text{accuracy} \\approx a + b \\cdot \\log(\\text{compute per answer})'}
            x={640}
            y={324}
            fontSize={20}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            sample · verify · vote · grade the steps · search — compute is a dial
          </text>
          <text x={640} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            and the dial only works when something can check the answer
          </text>
        </g>
      )}
    </>
  );
}

export function TestTimeScaling() {
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
