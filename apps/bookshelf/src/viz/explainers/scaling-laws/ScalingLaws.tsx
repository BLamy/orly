import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
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

// The three levers the opening question names; they fade as the axes change.
const LEVERS = [
  { label: 'more compute', x: 442, w: 124 },
  { label: 'more data', x: 580, w: 100 },
  { label: 'more parameters', x: 694, w: 144 },
];

// Each tenfold of compute multiplies the loss by this factor (10^-ALPHA_C).
const TENFOLD_FACTOR = Math.pow(10, -ALPHA_C).toFixed(2);

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
  const texU = s.get(scene.texU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // The log plot's baseline is the LOWEST loss (bottom); the top is the highest.
  const logBase = logY(Math.log10(lossOfLogC(LOGC_MAX)));
  const logTop = logY(Math.log10(lossOfLogC(LOGC_MIN)));
  const linBase = linY(0.5);

  // The linear panel is replaced by the log panel: it fades out as the axes change.
  const linO = linU * (1 - logU);
  const leverO = linU * (1 - logU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      {/* the three levers named by the opening question */}
      {leverO > 0 && (
        <g opacity={leverO}>
          {LEVERS.map((lever) => (
            <g key={lever.label}>
              <rect x={lever.x} y={26} width={lever.w} height={34} rx={17} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={lever.x + lever.w / 2} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                {lever.label}
              </text>
            </g>
          ))}
        </g>
      )}

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* LEFT panel — linear axes */}
          {linO > 0 && (
            <g opacity={linO}>
              <line x1={linX(0)} y1={linBase} x2={linX(0)} y2={linY(1.5)} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={linX(0)} y1={linBase} x2={linX(1000)} y2={linBase} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={linX(500)} y={linBase + 34} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
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
              <line x1={logX(LOGC_MIN)} y1={logTop} x2={logX(LOGC_MIN)} y2={logBase} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={logX(LOGC_MIN)} y1={logBase} x2={logX(LOGC_MAX)} y2={logBase} stroke={colors.GRID} strokeWidth={1.5} />
              {/* one tick per factor of ten: the axis is stretched evenly per decade */}
              {[-2, -1, 0, 1, 2, 3, 4, 5, 6].map((k) => (
                <g key={k}>
                  <line x1={logX(k)} y1={logBase} x2={logX(k)} y2={logBase + 6} stroke={colors.GRID} strokeWidth={1.5} />
                  <text x={logX(k)} y={logBase + 18} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                    10
                    <tspan dy={-6} fontSize={12}>
                      {k < 0 ? `−${-k}` : k}
                    </tspan>
                  </text>
                </g>
              ))}
              <text x={logX((LOGC_MIN + LOGC_MAX) / 2)} y={logBase + 40} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                compute (log scale)
              </text>
              <text x={logX(LOGC_MIN) - 20} y={logTop - 10} fill={colors.MUTED} fontSize={14}>
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

              {/* what one tenfold means: the loss is multiplied by the same factor each time */}
              {slopeU > 0 && (
                <text
                  x={logX(1) + 12}
                  y={logY(Math.log10(lossOfLogC(1))) - 8}
                  fill={colors.TEXT}
                  fontSize={15}
                  opacity={slopeU}
                >
                  {`each ×10 compute → loss ×${TENFOLD_FACTOR}`}
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed formula, set as plain text so it does not depend on KaTeX styles */}
      {texU > 0 && (
        <g opacity={texU * dimU}>
          <text x={1010} y={78} textAnchor="middle" fill={colors.WARM} fontSize={20}>
            L(C) = (C
            <tspan dy={5} fontSize={14}>
              c
            </tspan>
            <tspan dy={-5}> / C)</tspan>
            <tspan dy={-8} fontSize={14}>
              α
            </tspan>
            <tspan dy={8}>{'   α ≈ 0.05'}</tspan>
          </text>
          <text x={1010} y={108} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            published fit · Kaplan et al. 2020
          </text>
        </g>
      )}

      {/* clean ending card: solid panel, so nothing faded shows through */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={200} y={230} width={880} height={260} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Scaling Laws
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.WARM} fontSize={21}>
            a straight line you can plan around
          </text>
          <text x={640} y={412} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            loss falls as a power law in compute — smooth, predictable,
          </text>
          <text x={640} y={438} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and the reason models kept growing
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
