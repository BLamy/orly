import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  FINAL_INFLATION,
  FIXED_SCORES,
  GENS,
  REPORTED,
  ROLLING_SCORES,
  X0,
  X1,
  Y0,
  buildScene,
  gx,
  skillOf,
  sx,
  sy,
} from './scene';

/**
 * SWE-bench: A Case Study in Repair — pure render. The reported curve is
 * replotted public record (labeled); the fixed-vs-rolling curves and the
 * 36.9-point inflation come from the seeded simulation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/swe-bench-repair/overrides.json', slug: 'swe-bench-repair' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function polyPath(pts: [number, number][], toX: (x: number) => number, toY: (y: number) => number, u: number): string {
  const xMin = pts[0][0];
  const xMax = pts[pts.length - 1][0];
  const xEnd = xMin + (xMax - xMin) * clamp01(u);
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (x <= xEnd) d += `${d ? 'L' : 'M'}${toX(x).toFixed(1)},${toY(y).toFixed(1)} `;
    else {
      const [xa, ya] = pts[i - 1];
      const t = (xEnd - xa) / (x - xa);
      d += `L${toX(xEnd).toFixed(1)},${toY(ya + (y - ya) * t).toFixed(1)}`;
      break;
    }
  }
  return d;
}

const FIX_PTS: [number, number][] = FIXED_SCORES.map((v, i) => [i, v]);
const ROLL_PTS: [number, number][] = ROLLING_SCORES.map((v, i) => [i, v]);
const TRUE_PTS: [number, number][] = Array.from({ length: GENS }, (_, i) => [i, 100 * skillOf(i)]);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const histU = s.get(scene.histU);
  const verU = s.get(scene.verU);
  const retireU = s.get(scene.retireU);
  const simU = s.get(scene.simU);
  const fixU = s.get(scene.fixU);
  const rollU = s.get(scene.rollU);
  const gapU = s.get(scene.gapU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const histOp = 1 - simU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimU}>
          {/* shared axes frame */}
          <g opacity={axU}>
            <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={colors.GRID} />
            {[0, 50, 100].map((p) => (
              <g key={p}>
                <text x={X0 - 12} y={sy(p) + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                  {p}
                </text>
                <line x1={X0} y1={sy(p)} x2={X1} y2={sy(p)} stroke={colors.GRID} strokeDasharray="3 9" opacity={0.4} />
              </g>
            ))}
            <text x={X0 - 12} y={sy(100) - 22} textAnchor="end" fill={colors.MUTED} fontSize={13}>
              % resolved
            </text>
          </g>

          {/* — historical stage — */}
          <g opacity={histOp}>
            <g opacity={axU}>
              {[2024, 2025, 2026].map((yr) => (
                <text key={yr} x={sx(yr)} y={Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {yr}
                </text>
              ))}
              <text x={X1} y={Y0 + 48} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
                reported scores, replotted (approximate)
              </text>
            </g>
            <path d={polyPath(REPORTED, sx, sy, histU)} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeLinejoin="round" />
            {REPORTED.map(([x, y], i) => {
              const u = (x - REPORTED[0][0]) / (REPORTED[REPORTED.length - 1][0] - REPORTED[0][0]);
              if (u > histU) return null;
              return <circle key={i} cx={sx(x)} cy={sy(y)} r={4.5} fill={colors.ACCENT} />;
            })}
            {histU > 0.02 && (
              <text x={sx(2023.8) + 8} y={sy(1.96) - 12} fill={colors.WARM} fontSize={13.5}>
                Claude 2 · 1.96%
              </text>
            )}
            {verU > 0 && (
              <g opacity={verU}>
                <line x1={sx(2024.6)} y1={sy(100)} x2={sx(2024.6)} y2={Y0} stroke={colors.WARM} strokeDasharray="6 6" opacity={0.7} />
                <rect x={sx(2024.6) - 340} y={sy(100) - 4} width={320} height={148} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
                <text x={sx(2024.6) - 320} y={sy(100) + 26} fill={colors.TEXT} fontSize={14.5} fontWeight={650}>
                  SWE-bench Verified (Aug 2024)
                </text>
                <text x={sx(2024.6) - 320} y={sy(100) + 54} fill={colors.NEGATIVE} fontSize={13.5}>
                  38.3% flagged underspecified
                </text>
                <text x={sx(2024.6) - 320} y={sy(100) + 80} fill={colors.NEGATIVE} fontSize={13.5}>
                  61.1% flagged for unfair tests
                </text>
                <text x={sx(2024.6) - 320} y={sy(100) + 108} fill={colors.POSITIVE} fontSize={13.5}>
                  1,699 reviewed ×3 → 500 kept
                </text>
              </g>
            )}
            {retireU > 0 && (
              <g opacity={retireU}>
                <circle cx={sx(2026.2)} cy={sy(90)} r={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
                <text x={sx(2026.2) - 14} y={sy(90) - 16} textAnchor="end" fill={colors.NEGATIVE} fontSize={13.5}>
                  2026: curators audit failures → mostly test artifacts → retired
                </text>
              </g>
            )}
          </g>

          {/* — simulation stage — */}
          {simU > 0 && (
            <g opacity={simU}>
              {Array.from({ length: GENS }, (_, i) => (
                <text key={i} x={gx(i)} y={Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {`gen ${i}`}
                </text>
              ))}
              <text x={X1} y={Y0 + 48} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
                toy simulation — 160 items · leak 12%/gen · seeded
              </text>
              {/* true skill reference */}
              <path d={polyPath(TRUE_PTS, gx, sy, 1)} fill="none" stroke={colors.MUTED} strokeWidth={2} strokeDasharray="4 7" opacity={0.6} />
              <text x={gx(GENS - 1) + 8} y={sy(100 * skillOf(GENS - 1)) + 26} fill={colors.MUTED} fontSize={13}>
                true skill
              </text>
              {/* fixed pool */}
              <path d={polyPath(FIX_PTS, gx, sy, fixU)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
              {fixU > 0.95 && (
                <text x={gx(GENS - 1) + 8} y={sy(FIXED_SCORES[GENS - 1]) + 5} fill={colors.NEGATIVE} fontSize={14}>
                  {`fixed pool ${FIXED_SCORES[GENS - 1].toFixed(1)}`}
                </text>
              )}
              {/* rolling pool */}
              <path d={polyPath(ROLL_PTS, gx, sy, rollU)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              {rollU > 0.95 && (
                <text x={gx(GENS - 1) + 8} y={sy(ROLLING_SCORES[GENS - 1]) - 10} fill={colors.POSITIVE} fontSize={14}>
                  {`rolling pool ${ROLLING_SCORES[GENS - 1].toFixed(1)}`}
                </text>
              )}
              {/* inflation bracket */}
              {gapU > 0 && (
                <g opacity={gapU}>
                  <line x1={gx(GENS - 1) - 24} y1={sy(FIXED_SCORES[GENS - 1])} x2={gx(GENS - 1) - 24} y2={sy(ROLLING_SCORES[GENS - 1])} stroke={colors.WARM} strokeWidth={2.5} />
                  <text x={gx(GENS - 1) - 38} y={(sy(FIXED_SCORES[GENS - 1]) + sy(ROLLING_SCORES[GENS - 1])) / 2} textAnchor="end" fill={colors.WARM} fontSize={15} fontWeight={650}>
                    {`+${FINAL_INFLATION.toFixed(1)} pts of contamination`}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={210} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Durable Core Was the Scoring Rule
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            run the tests — verification survives; frozen question pools do not
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
            live variants roll new issues past every training cutoff
          </text>
        </g>
      )}
    </>
  );
}

export function SweBenchRepair() {
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
