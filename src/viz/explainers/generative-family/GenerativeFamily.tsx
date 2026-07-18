import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { FAMILY, N_PTS, abar, buildScene, noised, xScale, yScale } from './scene';

/**
 * Diffusion, Revisited From Here — the generative family tree.
 * Pure render: the melting spiral is the exact closed-form forward-noising
 * formula from scene.ts driven by one time channel; the family panel and
 * compute bars place VAE, GAN, autoregressive, and diffusion side by side.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/generative-family/overrides.json', slug: 'generative-family' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const ROW_COLORS = [colors.ACCENT, colors.NEGATIVE, colors.SECONDARY, colors.WARM];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const noiseT = s.get(scene.noiseT);
  const treeU = s.get(scene.treeU);
  const barsU = s.get(scene.barsU);
  const hlIdx = Math.round(s.get(scene.hlIdx));
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the melting/condensing point cloud — the one persistent object */}
          {Array.from({ length: N_PTS }, (_, i) => {
            const p = noised(i, noiseT);
            return (
              <circle
                key={i}
                cx={xScale(p[0])}
                cy={yScale(p[1])}
                r={3.4 * clamp01(dotsU * 2 - i / N_PTS)}
                fill={colors.ACCENT}
                opacity={0.8 - 0.25 * noiseT}
              />
            );
          })}

          {/* the family panel */}
          {treeU > 0 && (
            <g opacity={treeU}>
              <text x={1000} y={92} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={600}>
                the generative family
              </text>
              {FAMILY.map((n, i) => {
                const hot = hlIdx === i;
                const dimRow = hlIdx >= 0 && !hot ? 0.25 : 1;
                return (
                  <g key={i} opacity={dimRow}>
                    <rect
                      x={n.x - 130}
                      y={n.y - 34}
                      width={260}
                      height={68}
                      rx={12}
                      fill={colors.PANEL}
                      stroke={hot ? ROW_COLORS[i] : colors.GRID}
                      strokeWidth={hot ? 2.5 : 1.2}
                      opacity={0.92}
                    />
                    <text x={n.x} y={n.y - 6} textAnchor="middle" fill={ROW_COLORS[i]} fontSize={17} fontWeight={650}>
                      {n.label}
                    </text>
                    <text x={n.x} y={n.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      {n.sub}
                    </text>
                    {/* compute-per-sample bar (log scale, honest label) */}
                    {barsU > 0 && (
                      <g opacity={barsU}>
                        <rect
                          x={n.x + 140}
                          y={n.y - 8}
                          width={12 + 60 * (Math.log10(n.steps) / Math.log10(250))}
                          height={16}
                          rx={5}
                          fill={ROW_COLORS[i]}
                          opacity={0.8}
                        />
                        <text x={n.x + 140} y={n.y - 16} fill={colors.MUTED} fontSize={11}>
                          {`${n.steps} pass${n.steps > 1 ? 'es' : ''} / sample`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + the noise clock */}
      <MathLabel
        tex={'x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\;\\varepsilon'}
        x={330}
        y={66}
        fontSize={20}
        opacity={s.get(scene.texU) * dimU}
      />
      {badgeU > 0 && (
        <g opacity={badgeU * dimU}>
          <rect x={48} y={584} width={300} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`noise level t = ${noiseT.toFixed(2)} · ᾱ = ${abar(noiseT).toFixed(2)}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={232} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            One Game, Four Strategies
          </text>
          <MathLabel
            tex={'\\text{density} \\;\\cdot\\; \\text{latent space} \\;\\cdot\\; \\text{critic} \\;\\cdot\\; \\text{reverse decay}'}
            x={640}
            y={338}
            fontSize={20}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            all of them: make the data likely under something you can sample
          </text>
        </g>
      )}
    </>
  );
}

export function GenerativeFamily() {
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
