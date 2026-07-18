import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ALPHA_C,
  LOGC_MAX,
  LOGC_MIN,
  POINTS,
  buildScene,
  linLoss,
  linX,
  linY,
  logX,
  logY,
  lossOfLogC,
} from './scene';

/**
 * Scaling Laws — the straight line on the log-log plot.
 * Pure render: the linear-axes elbow and the log-log straight line are both
 * the SAME published power law (Kaplan et al. 2020) from scene.ts; the markers
 * are points sampled on the published fit, labeled honestly on screen.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/scaling-laws/overrides.json', slug: 'scaling-laws' };

function linPath(reveal: number): string {
  const N = 100;
  const n = Math.max(2, Math.round(N * reveal));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const c = 2 + (1000 - 2) * (i / N);
    d += `${i === 0 ? 'M' : 'L'}${linX(c).toFixed(1)} ${linY(linLoss(c)).toFixed(1)}`;
  }
  return d;
}

function logLinePath(reveal: number, from = LOGC_MIN, to = LOGC_MAX): string {
  const x0 = logX(from);
  const y0 = logY(Math.log10(lossOfLogC(from)));
  const x1 = logX(from + (to - from) * reveal);
  const y1 = logY(Math.log10(lossOfLogC(from + (to - from) * reveal)));
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const linU = s.get(scene.linU);
  const linCurveU = s.get(scene.linCurveU);
  const logU = s.get(scene.logU);
  const lineU = s.get(scene.lineU);
  const ptsU = s.get(scene.ptsU);
  const slopeU = s.get(scene.slopeU);
  const extendU = s.get(scene.extendU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* LEFT panel — linear axes */}
          {linU > 0 && (
            <g opacity={linU}>
              <line x1={linX(0)} y1={linY(0.5)} x2={linX(0)} y2={linY(1.5)} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={linX(0)} y1={linY(0.5)} x2={linX(1000)} y2={linY(0.5)} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={linX(500)} y={linY(0.5) + 32} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                compute (linear)
              </text>
              <text x={linX(0) - 18} y={linY(1.5) - 8} fill={colors.MUTED} fontSize={14}>
                loss
              </text>
              <path d={linPath(linCurveU)} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
              {linCurveU > 0.9 && (
                <text x={linX(560)} y={linY(linLoss(560)) - 14} fill={colors.ACCENT} fontSize={14}>
                  looks like a wall
                </text>
              )}
            </g>
          )}

          {/* RIGHT panel — log-log axes */}
          {logU > 0 && (
            <g opacity={logU}>
              <line x1={logX(LOGC_MIN)} y1={logY(Math.log10(lossOfLogC(LOGC_MIN)))} x2={logX(LOGC_MIN)} y2={logY(Math.log10(lossOfLogC(LOGC_MAX)))} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={logX(LOGC_MIN)} y1={logY(Math.log10(lossOfLogC(LOGC_MIN)))} x2={logX(LOGC_MAX)} y2={logY(Math.log10(lossOfLogC(LOGC_MIN)))} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={logX((LOGC_MIN + LOGC_MAX) / 2)} y={logY(Math.log10(lossOfLogC(LOGC_MIN))) + 32} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                compute (log scale)
              </text>
              <text x={logX(LOGC_MIN) - 20} y={logY(Math.log10(lossOfLogC(LOGC_MAX))) - 8} fill={colors.MUTED} fontSize={14}>
                loss (log)
              </text>

              {/* extrapolation dashed continuation */}
              {extendU > 0 && (
                <line
                  x1={logX(4)}
                  y1={logY(Math.log10(lossOfLogC(4)))}
                  x2={logX(4 + (LOGC_MAX - 4) * extendU)}
                  y2={logY(Math.log10(lossOfLogC(4 + (LOGC_MAX - 4) * extendU)))}
                  stroke={colors.POSITIVE}
                  strokeWidth={2.4}
                  strokeDasharray="8 6"
                  opacity={0.9}
                />
              )}

              {/* the straight power-law line */}
              <path d={logLinePath(lineU, LOGC_MIN, 4)} fill="none" stroke={colors.WARM} strokeWidth={3} />

              {/* points sampled on the published fit */}
              {ptsU > 0 &&
                POINTS.filter((p) => p.log10C <= 4).map((p, i) => (
                  <circle
                    key={i}
                    cx={logX(p.log10C)}
                    cy={logY(Math.log10(p.loss))}
                    r={5 * Math.min(1, ptsU * POINTS.length - i)}
                    fill={colors.WARM}
                    stroke={colors.BG}
                    strokeWidth={1.5}
                    opacity={Math.min(1, ptsU * POINTS.length - i)}
                  />
                ))}

              {/* slope annotation */}
              {slopeU > 0 && (
                <text x={logX(1)} y={logY(Math.log10(lossOfLogC(1))) - 26} fill={colors.WARM} fontSize={15} opacity={slopeU}>
                  {`slope ≈ −${ALPHA_C.toFixed(2)}`}
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'L(C) = \\left(\\tfrac{C_c}{C}\\right)^{\\alpha},\\quad \\alpha \\approx 0.05'}
        x={1010}
        y={70}
        fontSize={20}
        color={colors.WARM}
        opacity={s.get(scene.texU) * dimU}
      />
      {s.get(scene.texU) > 0.4 && (
        <text x={1010} y={104} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={s.get(scene.texU) * dimU}>
          published fit · Kaplan et al. 2020
        </text>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={210} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Scaling Laws
          </text>
          <MathLabel tex={'\\text{a straight line you can plan around}'} x={640} y={342} fontSize={21} color={colors.WARM} opacity={endU} />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            loss falls as a power law in compute — smooth, predictable, and the reason models kept growing
          </text>
        </g>
      )}
    </>
  );
}

export function ScalingLaws() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
