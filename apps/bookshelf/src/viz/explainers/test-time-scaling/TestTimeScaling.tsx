import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
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
          <g opacity={Math.max(0, 1 - axU)}>
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
                  <text x={REP_X + barW(r.from) + 8} y={y0 + 24} fill={colors.TEXT} opacity={0.85} fontSize={13}>
                    {`${(r.from * 100).toFixed(1)}% · 1 sample`}
                  </text>
                  <rect x={REP_X} y={y0 + 38} width={barW(r.to)} height={18} rx={4} fill={colors.ACCENT} opacity={0.85} />
                  <text x={REP_X + barW(r.to) + 8} y={y0 + 52} fill={colors.ACCENT} fontSize={13}>
                    {`${(r.to * 100).toFixed(0)}% · ${r.at}`}
                  </text>
                  <text x={REP_X} y={y0 + 86} fill={colors.WARM} fontSize={13} fontStyle="italic">
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
              {/* faint guides at 0.75 and 1.0 so the 75% and 100% claims have a line to read against */}
              {[0.75, 1.0].map((v) => (
                <line key={v} x1={CH_X0} y1={chY(v)} x2={chX(1280)} y2={chY(v)} stroke={colors.GRID} strokeDasharray="2 6" opacity={0.7} />
              ))}
              {[1, 10, 100, 1000].map((c) => (
                <text key={c} x={chX(c)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {c}
                </text>
              ))}
              <text x={chX(40)} y={CH_Y0 + 44} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                total compute per answer (log scale) →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                1.0
              </text>
              <text x={CH_X0 - 18} y={chY(0.75) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                0.75
              </text>
              <text x={CH_X0 - 18} y={chY(0.5) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                0.5
              </text>
              {/* model key, top-left of the plot where the curves have not yet risen */}
              <text x={CH_X0 + 6} y={chY(1.0) + 8} fill={colors.WARM} fontSize={13}>
                big: 3× skill, 10× cost
              </text>
              <text x={CH_X0 + 6} y={chY(1.0) + 30} fill={colors.POSITIVE} fontSize={13}>
                small: 1 per sample
              </text>
              <text x={chX(1280)} y={CH_Y0 - 10} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                toy suite · verified best-of-N
              </text>
            </g>
          )}
          {sweepB > 0 && (
            <g>
              <path d={curvePath(BIG, siB)} fill="none" stroke={colors.WARM} strokeWidth={3} />
              <circle cx={chX(nowB.cost)} cy={chY(nowB.acc)} r={5} fill={colors.WARM} />
              <text x={chX(nowB.cost) - 10} y={chY(nowB.acc) + 22} textAnchor="end" fill={colors.WARM} fontSize={13}>
                {`big model: ${(nowB.acc * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {sweepS > 0 && (
            <g>
              <path d={curvePath(SMALL, siS)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(nowS.cost)} cy={chY(nowS.acc)} r={5} fill={colors.POSITIVE} />
              <text x={chX(nowS.cost) - 8} y={chY(nowS.acc) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                {`small + verifier: ${(nowS.acc * 100).toFixed(0)}%`}
              </text>
            </g>
          )}
          {crossU > 0 && (
            <g opacity={crossU}>
              <line x1={chX(10)} y1={chY(1.0)} x2={chX(10)} y2={CH_Y0} stroke={colors.SECONDARY} strokeDasharray="5 5" strokeWidth={1.6} />
              <circle cx={chX(BIG_AT_1.cost)} cy={chY(BIG_AT_1.acc)} r={8} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} />
              <circle cx={chX(SMALL_AT_8.cost)} cy={chY(SMALL_AT_8.acc)} r={8} fill="none" stroke={colors.SECONDARY} strokeWidth={2.2} />
              <text x={chX(10) + 10} y={chY(0.55)} fill={colors.SECONDARY} fontSize={13}>
                same budget: 90% vs 75%
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g>
          {/* solid backdrop: the chart behind the card fades out completely */}
          <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} opacity={0.9 * endU} />
          <g opacity={endU}>
            <rect x={210} y={200} width={860} height={248} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
              The New Scaling Law
            </text>
            <text x={640} y={324} textAnchor="middle" fill={colors.ACCENT} fontSize={22}>
              accuracy ≈ a + b · log(compute per answer)
            </text>
            <text x={640} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
              sample · verify · vote · grade the steps · search — compute is a dial
            </text>
            <text x={640} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
              and the dial only works when something can check the answer
            </text>
          </g>
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
