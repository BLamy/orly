import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { SERIES, X0, X1, Y0, buildScene, sx, sy } from './scene';

/**
 * The Lifespan of a Benchmark — pure render. Reported frontier scores,
 * replotted (approximate), for GLUE / SuperGLUE / MMLU / GSM8K.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/benchmark-lifespan/overrides.json',
  slug: 'benchmark-lifespan',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Piecewise-linear curve, partially drawn to fraction u of its x-span. */
function PartialCurve({ pts, u, color, fade }: { pts: [number, number][]; u: number; color: string; fade: number }) {
  if (u <= 0) return null;
  const xEnd = pts[0][0] + (pts[pts.length - 1][0] - pts[0][0]) * u;
  const drawn: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i][0] <= xEnd) drawn.push(pts[i]);
    else {
      const [xa, ya] = pts[i - 1];
      const [xb, yb] = pts[i];
      const t = (xEnd - xa) / (xb - xa);
      drawn.push([xEnd, ya + (yb - ya) * t]);
      break;
    }
  }
  const d = drawn.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
  const last = drawn[drawn.length - 1];
  return (
    <g opacity={fade}>
      <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      {pts.map(([x, y]) =>
        x <= xEnd ? <circle key={x} cx={sx(x)} cy={sy(y)} r={4} fill={color} /> : null,
      )}
      <circle cx={sx(last[0])} cy={sy(last[1])} r={5.5} fill={color} />
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const ceilU = s.get(scene.ceilU);
  const windowU = s.get(scene.windowU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimU}>
          {/* axes */}
          <g opacity={axU}>
            <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={colors.GRID} />
            <line x1={X0} y1={Y0} x2={X0} y2={sy(102)} stroke={colors.GRID} />
            {[2018, 2020, 2022, 2024, 2026].map((yr) => (
              <g key={yr}>
                <line x1={sx(yr)} y1={Y0} x2={sx(yr)} y2={Y0 + 6} stroke={colors.MUTED} />
                <text x={sx(yr)} y={Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {yr}
                </text>
              </g>
            ))}
            {[0, 50, 100].map((p) => (
              <text key={p} x={X0 - 12} y={sy(p) + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                {p}
              </text>
            ))}
            <text x={X0 - 12} y={sy(108)} textAnchor="end" fill={colors.MUTED} fontSize={13}>
              score %
            </text>
            <text x={X1} y={Y0 + 48} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
              best reported score, replotted (approximate)
            </text>
          </g>

          {/* ceiling */}
          {ceilU > 0 && (
            <g opacity={ceilU}>
              <line x1={X0} y1={sy(100)} x2={X0 + (X1 - X0) * clamp01(ceilU)} y2={sy(100)} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="7 7" opacity={0.8} />
              <text x={X1 - 4} y={sy(100) - 10} textAnchor="end" fill={colors.NEGATIVE} fontSize={14}>
                ceiling — nothing left to measure
              </text>
            </g>
          )}

          {/* discriminative window band (score 30..85) */}
          {windowU > 0 && (
            <g opacity={windowU * 0.9}>
              <rect x={X0} y={sy(85)} width={X1 - X0} height={sy(30) - sy(85)} fill={colors.POSITIVE} opacity={0.08} />
              <line x1={X0} y1={sy(85)} x2={X1} y2={sy(85)} stroke={colors.POSITIVE} strokeDasharray="4 6" opacity={0.5} />
              <line x1={X0} y1={sy(30)} x2={X1} y2={sy(30)} stroke={colors.POSITIVE} strokeDasharray="4 6" opacity={0.5} />
              <text x={X0 + 10} y={sy(85) + 24} fill={colors.POSITIVE} fontSize={14.5}>
                the discriminative window — where scores separate models
              </text>
            </g>
          )}

          {/* the four reported curves */}
          {SERIES.map((ser, i) => (
            <PartialCurve key={ser.name} pts={ser.pts} u={s.get(scene.drawU[i])} color={ser.color} fade={s.get(scene.fadeU[i])} />
          ))}
          {SERIES.map((ser, i) => {
            const u = s.get(scene.drawU[i]);
            if (u <= 0.15) return null;
            const last = ser.pts[ser.pts.length - 1];
            return (
              <text key={ser.name} x={sx(last[0]) + 10} y={sy(last[1]) + 5} fill={ser.color} fontSize={14.5} opacity={s.get(scene.fadeU[i]) * clamp01((u - 0.15) * 4)}>
                {ser.name}
              </text>
            );
          })}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={210} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            A Benchmark Is an Instrument
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            and instruments wear out — GLUE ~2yr · SuperGLUE ~2yr · MMLU ~4yr · GSM8K ~2.5yr
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
            the question is not the score — it is the remaining lifespan
          </text>
        </g>
      )}
    </>
  );
}

export function BenchmarkLifespan() {
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
