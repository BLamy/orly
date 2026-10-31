import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  DATA,
  EM,
  LL_LAST,
  N_ITERS,
  N_PTS,
  SAMPLES,
  buildScene,
  compsAt,
  llX,
  llY,
  xScale,
  yScale,
} from './scene';

/**
 * Density — what "learning a distribution" means.
 * Pure render: the mixture circles replay the RECORDED expectation-maximization
 * trajectory from scene.ts, the log-likelihood curve is the true score per
 * iteration, and the closing samples are genuinely drawn from the fitted model.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/density-estimation/overrides.json', slug: 'density-estimation' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const COMP_COLORS = [colors.ACCENT, colors.WARM, colors.SECONDARY];

// A faint lattice of every possible point: the caption at 6.5s says the model
// assigns a probability to each of them.
const LATTICE: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < 18; i++) {
    for (let j = 0; j < 11; j++) out.push([-3 + (i * 6) / 17, -2.5 + j * 0.5]);
  }
  return out;
})();

function llPath(u: number): string {
  const n = Math.max(1, Math.round(u * N_ITERS));
  let d = `M${llX(0).toFixed(1)} ${llY(EM[0].ll).toFixed(1)}`;
  for (let i = 1; i <= n; i++) d += `L${llX(i).toFixed(1)} ${llY(EM[i].ll).toFixed(1)}`;
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const circlesU = s.get(scene.circlesU);
  const emProg = s.get(scene.emProg);
  const llU = s.get(scene.llU);
  const fieldU = s.get(scene.fieldU);
  const samplesU = s.get(scene.samplesU);
  const dataDim = s.get(scene.dataDim);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const comps = compsAt(emProg);
  const iterShown = Math.min(N_ITERS, Math.max(0, Math.round(emProg)));

  // pixels per data-unit (x): used to draw sigma circles to scale
  const pxPerUnit = Math.abs(xScale(1) - xScale(0));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {LATTICE.map((p, i) => (
            <circle key={`l${i}`} cx={xScale(p[0])} cy={yScale(p[1])} r={1.8} fill={colors.MUTED} opacity={0.2 * dotsU} />
          ))}

          {/* the data — the one thing we are ever given */}
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p[0])}
              cy={yScale(p[1])}
              r={3.6 * clamp01(dotsU * 2 - i / N_PTS)}
              fill={colors.MUTED}
              opacity={0.75 * dataDim}
            />
          ))}

          {/* fitted density shading (2-sigma soft discs) for the sampling beat */}
          {fieldU > 0 &&
            comps.map((c, k) => (
              <g key={k} opacity={fieldU}>
                <circle cx={xScale(c.m[0])} cy={yScale(c.m[1])} r={c.s * 2 * pxPerUnit} fill={COMP_COLORS[k]} opacity={0.08} />
                <circle cx={xScale(c.m[0])} cy={yScale(c.m[1])} r={c.s * pxPerUnit} fill={COMP_COLORS[k]} opacity={0.1} />
              </g>
            ))}

          {/* the model: one and two sigma rings per component, replaying EM */}
          {circlesU > 0 &&
            comps.map((c, k) => (
              <g key={k} opacity={circlesU}>
                <circle
                  cx={xScale(c.m[0])}
                  cy={yScale(c.m[1])}
                  r={c.s * pxPerUnit}
                  fill="none"
                  stroke={COMP_COLORS[k]}
                  strokeWidth={2.6}
                  opacity={0.95}
                />
                <circle
                  cx={xScale(c.m[0])}
                  cy={yScale(c.m[1])}
                  r={c.s * 2 * pxPerUnit}
                  fill="none"
                  stroke={COMP_COLORS[k]}
                  strokeWidth={1.2}
                  strokeDasharray="5 5"
                  opacity={0.6}
                />
                <circle cx={xScale(c.m[0])} cy={yScale(c.m[1])} r={4} fill={COMP_COLORS[k]} />
              </g>
            ))}

          {/* fresh samples from the fitted model */}
          {samplesU > 0 &&
            SAMPLES.map((p, i) => (
              <circle
                key={i}
                cx={xScale(p[0])}
                cy={yScale(p[1])}
                r={3.8 * clamp01(samplesU * SAMPLES.length - i)}
                fill={colors.POSITIVE}
                opacity={0.9}
              />
            ))}

        </g>
      </Camera>

      {/* screen-fixed legend and log-likelihood chart: they fade with the scene too */}
      <g opacity={dimU}>
        {circlesU > 0 && (
          <g opacity={circlesU}>
            <text x={1050} y={118} fill={colors.MUTED} fontSize={14}>
              share of the data
            </text>
            {comps.map((c, k) => (
              <g key={k}>
                <circle cx={1058} cy={142 + k * 24} r={6} fill={COMP_COLORS[k]} />
                <text x={1072} y={147 + k * 24} fill={COMP_COLORS[k]} fontSize={16} fontWeight={600}>
                  {`${(c.pi * 100).toFixed(0)}%`}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* log-likelihood curve */}
        {llU > 0 && (
          <g opacity={llU}>
            <line x1={llX(0)} y1={llY.range()[0]} x2={llX(N_ITERS)} y2={llY.range()[0]} stroke={colors.GRID} strokeWidth={1.5} />
            <line x1={llX(0)} y1={llY.range()[0]} x2={llX(0)} y2={llY.range()[1]} stroke={colors.GRID} strokeWidth={1.5} />
            <path d={llPath(Math.min(1, emProg / N_ITERS))} fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} />
            <text x={llX(N_ITERS / 2)} y={llY.range()[0] + 24} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              iteration
            </text>
            <text x={llX(0)} y={llY.range()[1] - 10} fill={colors.MUTED} fontSize={14}>
              log-likelihood
            </text>
            <text x={llX(N_ITERS) + 4} y={llY(LL_LAST) + 4} fill={colors.POSITIVE} fontSize={14}>
              {LL_LAST.toFixed(0)}
            </text>
          </g>
        )}
      </g>

      {/* screen-fixed math + iteration badge */}
      <text x={1240} y={76} textAnchor="end" fill={colors.TEXT} fontSize={20} opacity={s.get(scene.texU)}>
        p(x) = Σ<tspan dy={6} fontSize={14}>k</tspan>
        <tspan dy={-6}> π</tspan>
        <tspan dy={6} fontSize={14}>k</tspan>
        <tspan dy={-6}> N(x | μ</tspan>
        <tspan dy={6} fontSize={14}>k</tspan>
        <tspan dy={-6}>, σ</tspan>
        <tspan dy={6} fontSize={14}>k</tspan>
        <tspan dy={-6} fontSize={20}>²)</tspan>
      </text>
      {badgeU > 0 && (
        <g opacity={badgeU}>
          <rect x={48} y={584} width={230} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`EM iteration ${iterShown} / ${N_ITERS}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={170} y={220} width={940} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Learning a Distribution
          </text>
          <text x={640} y={345} textAnchor="middle" fill={colors.WARM} fontSize={20}>
            fit p<tspan dy={6} fontSize={14}>θ</tspan>
            <tspan dy={-6}>(x) to make the data likely — then sample it</tspan>
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`3 bumps: centers, widths, shares · ${N_ITERS} EM iterations · new points from a model, not a copy`}
          </text>
        </g>
      )}
    </>
  );
}

export function DensityEstimation() {
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
