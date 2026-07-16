import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CAL,
  CURVE_CAL,
  CURVE_RAW,
  N_PLOT,
  RAW,
  REL_S,
  REL_X0,
  REL_Y0,
  TEST,
  TRAIN,
  T_STAR,
  W,
  X_MAX,
  X_MIN,
  buildScene,
  rx,
  ry,
  sx,
  sy,
} from './scene';

/**
 * Calibration — pure render. The cliff-like sigmoid, both reliability
 * diagrams, and the ECE numbers come from the real trained classifier in
 * scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/calibration/overrides.json', slug: 'calibration' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function sigPath(calW: number, reveal: number): string {
  const n = Math.max(2, Math.ceil(reveal * N_PLOT));
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / (N_PLOT - 1);
    const p = lerp(CURVE_RAW[i], CURVE_CAL[i], calW);
    d += `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)} ${sy(p).toFixed(1)}`;
  }
  return d;
}

// a deterministic subset of test points for the strip (render-only)
const STRIP_PTS = TEST.filter((_, i) => i % 50 === 0); // 80 points

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dataU = s.get(scene.dataU);
  const curveU = s.get(scene.curveU);
  const testU = s.get(scene.testU);
  const relU = s.get(scene.relU);
  const barsU = s.get(scene.barsU);
  const calW = s.get(scene.calW);
  const eceU = s.get(scene.eceU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const bins = RAW.bins.map((b, i) => ({
    n: b.n,
    conf: lerp(b.conf, CAL.bins[i].conf, calW),
    acc: lerp(b.acc, CAL.bins[i].acc, calW),
  }));
  const ece = lerp(RAW.ece, CAL.ece, calW);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* — classifier strip — */}
          <g opacity={dataU}>
            <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} stroke={colors.GRID} />
            <line x1={sx(X_MIN)} y1={sy(1)} x2={sx(X_MAX)} y2={sy(1)} stroke={colors.GRID} strokeDasharray="4 6" />
            <text x={sx(X_MIN) - 10} y={sy(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              p=1
            </text>
            <text x={sx(X_MIN) - 10} y={sy(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              p=0
            </text>
          </g>
          {/* train points */}
          {TRAIN.map((pt, i) => (
            <circle
              key={i}
              cx={sx(Math.max(X_MIN, Math.min(X_MAX, pt.x)))}
              cy={sy(pt.y)}
              r={6}
              fill={pt.y ? colors.ACCENT : colors.NEGATIVE}
              opacity={0.95 * clamp01(dataU * 8 - i)}
            />
          ))}
          {dataU > 0.9 && (
            <text x={sx(0)} y={sy(1) - 14} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={dataU}>
              eight training points, trained to convergence
            </text>
          )}
          {/* fresh points */}
          {testU > 0 &&
            STRIP_PTS.map((pt, i) => (
              <circle
                key={i}
                cx={sx(Math.max(X_MIN, Math.min(X_MAX, pt.x)))}
                cy={sy(pt.y) + (pt.y ? 14 : -14)}
                r={2.5}
                fill={pt.y ? colors.ACCENT : colors.NEGATIVE}
                opacity={0.5 * clamp01(testU * 80 - i)}
              />
            ))}
          {/* the sigmoid */}
          {curveU > 0 && <path d={sigPath(calW, curveU)} fill="none" stroke={colors.WARM} strokeWidth={3} />}
          {curveU > 0.9 && (
            <text x={sx(1.6)} y={sy(0.82)} fill={colors.WARM} fontSize={13.5} opacity={clamp01((curveU - 0.9) * 10)}>
              {calW > 0.5 ? `scores ÷ ${T_STAR.toFixed(1)}` : `weight ${W.toFixed(1)} — a cliff`}
            </text>
          )}

          {/* — reliability diagram — */}
          {relU > 0 && (
            <g opacity={relU}>
              <rect x={rx(0.5)} y={ry(1)} width={REL_S} height={REL_S} fill="none" stroke={colors.GRID} />
              <line x1={rx(0.5)} y1={ry(0.5)} x2={rx(1)} y2={ry(1)} stroke={colors.MUTED} strokeDasharray="6 6" opacity={0.7} />
              <text x={rx(0.75)} y={ry(0.5) + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                claimed confidence →
              </text>
              <text x={rx(0.5) - 16} y={ry(0.75)} textAnchor="middle" fill={colors.MUTED} fontSize={13} transform={`rotate(-90 ${rx(0.5) - 16} ${ry(0.75)})`}>
                actual accuracy →
              </text>
              <text x={rx(0.97)} y={ry(0.99)} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                honesty
              </text>
            </g>
          )}
          {relU > 0 &&
            bins.map((b, i) => {
              const u = clamp01(barsU - i);
              if (u <= 0 || b.n === 0) return null;
              const x0 = rx(0.5 + i * 0.05) + 2;
              const w = (REL_S / 10) - 4;
              const h = (b.acc - 0.5) * 2 * REL_S * u;
              const gap = b.conf - b.acc;
              return (
                <g key={i}>
                  <rect
                    x={x0}
                    y={REL_Y0 - Math.max(0, h)}
                    width={w}
                    height={Math.max(1, Math.abs(h))}
                    rx={3}
                    fill={gap > 0.06 ? colors.NEGATIVE : colors.POSITIVE}
                    opacity={0.8 * u}
                  />
                  {/* claimed confidence tick */}
                  <line x1={x0} y1={ry(b.conf)} x2={x0 + w} y2={ry(b.conf)} stroke={colors.WARM} strokeWidth={2} opacity={u} />
                </g>
              );
            })}
          {eceU > 0 && (
            <g opacity={eceU}>
              <rect x={rx(0.5) - 320} y={ry(0.62)} width={270} height={86} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
              <text x={rx(0.5) - 298} y={ry(0.62) + 32} fill={colors.TEXT} fontSize={15}>
                expected calibration error
              </text>
              <text x={rx(0.5) - 298} y={ry(0.62) + 64} fill={ece > 0.1 ? colors.NEGATIVE : colors.POSITIVE} fontSize={22} fontWeight={650}>
                {ece.toFixed(3)}
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
            Calibration
          </text>
          <MathLabel
            tex={'\\text{ECE}: 0.238 \\;\\to\\; 0.031 \\quad \\text{via } p = \\sigma(z/T^*)'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.POSITIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            accurate and dangerous: its ninety-nine percent meant seventy-six
          </text>
        </g>
      )}
    </>
  );
}

export function Calibration() {
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
