import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  CROSS_YEAR,
  PROJ_HI,
  PROJ_LO,
  RUNS,
  STOCK_T,
  YEAR1,
  buildScene,
  chX,
  chY,
  fitTokens,
} from './scene';

/**
 * The Data Wall — pure render. Reported points labeled as reported; the
 * trend is a computed log-linear fit with a labeled extrapolation.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/data-wall/overrides.json', slug: 'data-wall' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function trendPath(y0: number, y1: number): string {
  let d = '';
  for (let i = 0; i <= 40; i++) {
    const y = y0 + (i / 40) * (y1 - y0);
    d += `${i === 0 ? 'M' : 'L'}${chX(y).toFixed(1)} ${chY(fitTokens(y)).toFixed(1)}`;
  }
  return d;
}
const SOLID_TREND = trendPath(2020, 2024);
const DASHED_TREND = trendPath(2024, 2031);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const ptsU = s.get(scene.ptsU);
  const wallU = s.get(scene.wallU);
  const trendU = s.get(scene.trendU);
  const bandU = s.get(scene.bandU);
  const synthU = s.get(scene.synthU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* axes */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={chX(2019)} y1={CH_Y0} x2={chX(YEAR1)} y2={CH_Y0} stroke={colors.GRID} />
              {[2020, 2022, 2024, 2026, 2028, 2030, 2032].map((y) => (
                <text key={y} x={chX(y)} y={CH_Y0 + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {y}
                </text>
              ))}
              {[0.1, 1, 10, 100, 1000].map((t) => (
                <g key={t}>
                  <line x1={chX(2019)} y1={chY(t)} x2={chX(YEAR1)} y2={chY(t)} stroke={colors.GRID} opacity={0.35} />
                  <text x={chX(2019) - 10} y={chY(t) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                    {t >= 1 ? `${t}T` : '0.1T'}
                  </text>
                </g>
              ))}
              <text x={chX(2019)} y={chY(1000) - 16} fill={colors.MUTED} fontSize={12.5}>
                training tokens (log scale) · all points labeled reported
              </text>
            </g>
          )}

          {/* reported points */}
          {RUNS.map((r, i) => {
            const u = clamp01(ptsU - i);
            if (u <= 0) return null;
            return (
              <g key={r.label} opacity={u}>
                <circle cx={chX(r.year)} cy={chY(r.tokens)} r={7} fill={colors.ACCENT} />
                <text x={chX(r.year) + 12} y={chY(r.tokens) - 8} fill={colors.ACCENT} fontSize={12.5}>
                  {r.label}
                </text>
              </g>
            );
          })}
          {ptsU > 3.5 && (
            <text x={chX(2020)} y={chY(0.3) + 28} fill={colors.WARM} fontSize={11.5} fontStyle="italic" opacity={clamp01(ptsU - 3.5)}>
              reported training-set sizes
            </text>
          )}

          {/* the stock wall */}
          {wallU > 0 && (
            <g opacity={wallU}>
              <line x1={chX(2019)} y1={chY(STOCK_T)} x2={chX(YEAR1)} y2={chY(STOCK_T)} stroke={colors.NEGATIVE} strokeWidth={2.5} />
              <text x={chX(2019.3)} y={chY(STOCK_T) - 10} fill={colors.NEGATIVE} fontSize={13} fontWeight={640}>
                ~300T: effective stock of public human text
              </text>
              <text x={chX(2019.3)} y={chY(STOCK_T) + 18} fill={colors.WARM} fontSize={11.5} fontStyle="italic">
                reported — Villalobos et al., Epoch AI
              </text>
            </g>
          )}

          {/* trend + extrapolation */}
          {trendU > 0 && (
            <g>
              <path d={SOLID_TREND} fill="none" stroke={colors.TEXT} strokeWidth={2.2} opacity={trendU * 0.9} />
              <path d={DASHED_TREND} fill="none" stroke={colors.TEXT} strokeWidth={2.2} strokeDasharray="7 6" opacity={trendU * 0.7} />
              <text x={chX(2028.6)} y={chY(fitTokens(2028)) + 26} fill={colors.MUTED} fontSize={11.5} opacity={trendU}>
                extrapolated fit (ours)
              </text>
              <circle cx={chX(CROSS_YEAR)} cy={chY(STOCK_T)} r={8} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={trendU} />
            </g>
          )}
          {bandU > 0 && (
            <g opacity={bandU}>
              <rect x={chX(PROJ_LO)} y={chY(STOCK_T) - 60} width={chX(PROJ_HI) - chX(PROJ_LO)} height={120} fill={colors.WARM} opacity={0.1} />
              <text x={chX((PROJ_LO + PROJ_HI) / 2)} y={chY(STOCK_T) - 70} textAnchor="middle" fill={colors.WARM} fontSize={12}>
                reported projection: full use 2026–2032
              </text>
            </g>
          )}

          {/* what synthetic changes */}
          {synthU > 0 && (
            <g opacity={synthU}>
              <rect x={chX(2025)} y={chY(1) - 30} width={chX(YEAR1) - chX(2025) - 10} height={96} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
              <text x={(chX(2025) + chX(YEAR1) - 10) / 2} y={chY(1)} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontWeight={640}>
                past the wall: generate → verify → keep
              </text>
              <text x={(chX(2025) + chX(YEAR1) - 10) / 2} y={chY(1) + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                each kept sample carries information
              </text>
              <text x={(chX(2025) + chX(YEAR1) - 10) / 2} y={chY(1) + 44} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                the check extracted from reality
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
            The Data Wall
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            the loop · the collapse · the filter · the bootstrap · the wall
          </text>
          <MathLabel
            tex={'\\text{data was never the resource — checked data is}'}
            x={640}
            y={374}
            fontSize={20}
            color={colors.POSITIVE}
            opacity={endU}
          />
          <text x={640} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            the bottleneck becomes how much verification you can afford
          </text>
        </g>
      )}
    </>
  );
}

export function DataWall() {
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
