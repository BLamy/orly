import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  AGG_STD,
  ANCHOR_A,
  ANCHOR_B,
  DATA,
  MU_SPREAD,
  N_PTS,
  N_STEPS,
  SIGMA,
  Z_A,
  Z_AXIS_Y,
  Z_B,
  buildScene,
  decode,
  thetaAt,
  xScale,
  yScale,
  zScale,
} from './scene';
import type { Theta } from './scene';

/**
 * The VAE — a latent space you can walk.
 * Pure render: codes, fuzz intervals, the prior curve, the latent walk, and
 * the interpolation all derive from the RECORDED linear-VAE training run in
 * scene.ts (true closed-form objective, numeric gradients).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/vae/overrides.json', slug: 'vae' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const encMu = (x: [number, number], th: Theta): number => th[0] * x[0] + th[1] * x[1];

/** Standard normal curve above the latent axis. */
function priorPath(): string {
  let d = '';
  for (let i = 0; i <= 60; i++) {
    const z = -3 + (6 * i) / 60;
    const y = Z_AXIS_Y - 150 * Math.exp((-z * z) / 2);
    d += `${i === 0 ? 'M' : 'L'}${zScale(z).toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const axisU = s.get(scene.axisU);
  const codesU = s.get(scene.codesU);
  const fuzzU = s.get(scene.fuzzU);
  const priorU = s.get(scene.priorU);
  const stepProg = s.get(scene.stepProg);
  const lineU = s.get(scene.lineU);
  const walkZ = s.get(scene.walkZ);
  const walkU = s.get(scene.walkU);
  const lerpU = s.get(scene.lerpU);
  const lerpOn = s.get(scene.lerpOn);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const th = thetaAt(stepProg);
  const sigma = Math.exp(th[4]);
  const stepShown = Math.min(N_STEPS, Math.max(0, Math.round(stepProg)));

  // decoder line span in data space
  const vn = Math.hypot(th[2], th[3]) || 1;
  const L = 3.2;

  // latent walk: decoded point
  const walkPt = decode(walkZ, th);

  // interpolation: z lerp between the two anchors, decoded
  const zLerp = Z_A + (Z_B - Z_A) * lerpU;
  const lerpPt = decode(zLerp);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* data cloud */}
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p[0])}
              cy={yScale(p[1])}
              r={3.2 * clamp01(dotsU * 2 - i / N_PTS)}
              fill={colors.MUTED}
              opacity={0.75}
            />
          ))}

          {/* decoder line — the manifold in data space */}
          {lineU > 0 && (
            <line
              x1={xScale((-th[2] / vn) * L * lineU)}
              y1={yScale((-th[3] / vn) * L * lineU)}
              x2={xScale((th[2] / vn) * L * lineU)}
              y2={yScale((th[3] / vn) * L * lineU)}
              stroke={colors.WARM}
              strokeWidth={2.6}
              opacity={0.9}
            />
          )}

          {/* the latent number line */}
          {axisU > 0 && (
            <g opacity={axisU}>
              <line x1={zScale(-3)} y1={Z_AXIS_Y} x2={zScale(-3) + (zScale(3) - zScale(-3)) * axisU} y2={Z_AXIS_Y} stroke={colors.TEXT} strokeWidth={2} opacity={0.8} />
              {[-2, -1, 0, 1, 2].map((z) => (
                <g key={z}>
                  <line x1={zScale(z)} y1={Z_AXIS_Y - 5} x2={zScale(z)} y2={Z_AXIS_Y + 5} stroke={colors.TEXT} strokeWidth={1.5} opacity={0.7} />
                  <text x={zScale(z)} y={Z_AXIS_Y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {z}
                  </text>
                </g>
              ))}
              <text x={zScale(0)} y={Z_AXIS_Y + 50} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                latent axis z
              </text>
            </g>
          )}

          {/* fuzz intervals (mu ± sigma) then code ticks */}
          {fuzzU > 0 &&
            DATA.map((x, i) => {
              if (i % 4 !== 0) return null; // a readable subsample of intervals
              const mu = encMu(x, th);
              return (
                <line
                  key={i}
                  x1={zScale(mu - sigma)}
                  x2={zScale(mu + sigma)}
                  y1={Z_AXIS_Y - 14}
                  y2={Z_AXIS_Y - 14}
                  stroke={colors.SECONDARY}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.18 * fuzzU}
                />
              );
            })}
          {codesU > 0 &&
            DATA.map((x, i) => {
              const mu = encMu(x, th);
              return (
                <line
                  key={i}
                  x1={zScale(mu)}
                  x2={zScale(mu)}
                  y1={Z_AXIS_Y - 20}
                  y2={Z_AXIS_Y - 6}
                  stroke={colors.ACCENT}
                  strokeWidth={1.4}
                  opacity={0.5 * codesU}
                />
              );
            })}

          {/* the prior curve */}
          {priorU > 0 && (
            <path d={priorPath()} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} opacity={0.85 * priorU} strokeDasharray="1 0" />
          )}

          {/* the latent walker + its decoded point */}
          {walkU > 0 && (
            <g opacity={walkU * (1 - lerpOn)}>
              <circle cx={zScale(walkZ)} cy={Z_AXIS_Y - 13} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
              <circle cx={xScale(walkPt[0])} cy={yScale(walkPt[1])} r={10} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
              <text x={zScale(walkZ)} y={Z_AXIS_Y - 30} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                {`z = ${walkZ.toFixed(1)}`}
              </text>
            </g>
          )}

          {/* interpolation beat */}
          {lerpOn > 0.5 && (
            <g>
              {[ANCHOR_A, ANCHOR_B].map((p, i) => (
                <circle key={i} cx={xScale(p[0])} cy={yScale(p[1])} r={8} fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} />
              ))}
              <line x1={zScale(Z_A)} x2={zScale(Z_A) + (zScale(Z_B) - zScale(Z_A)) * lerpU} y1={Z_AXIS_Y - 13} y2={Z_AXIS_Y - 13} stroke={colors.POSITIVE} strokeWidth={3} opacity={0.8} />
              <circle cx={zScale(zLerp)} cy={Z_AXIS_Y - 13} r={9} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={2} />
              <circle cx={xScale(lerpPt[0])} cy={yScale(lerpPt[1])} r={10} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={2} />
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + badge */}
      <MathLabel
        tex={'L = \\lVert x - \\hat x\\rVert^2 + \\mathrm{KL}\\big(\\mathcal{N}(\\mu,\\sigma^2)\\,\\|\\,\\mathcal{N}(0,1)\\big)'}
        x={1000}
        y={70}
        fontSize={19}
        opacity={s.get(scene.texU) * dimU}
      />
      {badgeU > 0 && (
        <g opacity={badgeU}>
          <rect x={48} y={584} width={260} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`step ${stepShown} / ${N_STEPS} · σ = ${sigma.toFixed(2)}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Variational Autoencoder
          </text>
          <MathLabel
            tex={`\\sqrt{${MU_SPREAD.toFixed(2)}^2 + ${SIGMA.toFixed(2)}^2} = ${AGG_STD.toFixed(2)} \\approx 1`}
            x={640}
            y={345}
            fontSize={21}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the codes collectively tile the prior — so sampling, walking, and interpolating all work
          </text>
        </g>
      )}
    </>
  );
}

export function Vae() {
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
