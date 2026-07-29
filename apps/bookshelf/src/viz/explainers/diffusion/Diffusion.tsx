import { scaleLinear } from 'd3';
import { MathLabel, Player, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import type { SceneState } from '../../core';
import { NumberLine, ParticleCloud, Vec } from '../../primitives';
import { buildScene, computeParticles, PANEL, SCORE_ARROWS } from './scene';

/** Scene built once at module scope — the render below is pure. */
const { tl, ch } = buildScene();
tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/diffusion/overrides.json', slug: 'diffusion' };
const compute = (s: SceneState) => computeParticles(s, ch);

/* Timestep bar (bottom, above the caption lower-third). */
const T_MAX = 1000;
const BAR_Y = 584;
const tScale = scaleLinear<number, number>().domain([0, T_MAX]).range([340, 940]);

/* Finale gap between the two panels. */
const GAP_L = PANEL.lx + PANEL.w / 2 + 22;
const GAP_R = PANEL.rx - PANEL.w / 2 - 22;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Pure frame render — exported for the book player (see src/viz/scenes.ts). */
export function Render({ s }: { s: SceneState }) {
  const sigma = clamp01(s.get(ch.sigma));
  const barU = s.get(ch.barU);
  const scoreU = s.get(ch.scoreU);
  const scoreGrow = s.get(ch.scoreGrow);
  const splitU = s.get(ch.splitU);
  const linkU = s.get(ch.linkU);
  const markerX = tScale(sigma * T_MAX);
  return (
    <>
      {/* Panel frames sit under the canvas so points draw on top. */}
      {splitU > 0 && (
        <g opacity={splitU}>
          <rect
            x={PANEL.lx - PANEL.w / 2}
            y={PANEL.cy - PANEL.h / 2}
            width={PANEL.w}
            height={PANEL.h}
            rx={14}
            fill={colors.PANEL}
            stroke={colors.GRID}
            strokeWidth={1.5}
          />
          <rect
            x={PANEL.rx - PANEL.w / 2}
            y={PANEL.cy - PANEL.h / 2}
            width={PANEL.w}
            height={PANEL.h}
            rx={14}
            fill={colors.PANEL}
            stroke={colors.GRID}
            strokeWidth={1.5}
          />
        </g>
      )}

      {/* The cloud: 2200 points, each a closed form of σ. */}
      <ParticleCloud state={s} compute={compute} alpha={1} />

      {/* Score field — "which way is less noisy". */}
      {scoreU > 0 &&
        SCORE_ARROWS.map((v, i) => (
          <Vec
            key={i}
            x1={v.x1}
            y1={v.y1}
            x2={v.x2}
            y2={v.y2}
            grow={scoreGrow}
            opacity={scoreU}
            color={colors.WARM}
            width={2.5}
            head={9}
          />
        ))}

      {/* Timestep bar: the marker reads σ, so it fills and drains in sync. */}
      {barU > 0 && (
        <g>
          <NumberLine
            scale={tScale}
            y={BAR_Y}
            reveal={barU}
            opacity={barU}
            ticks={5}
            tickFormat={(v) => String(v)}
            label="timestep t"
          />
          <line
            x1={tScale(0)}
            y1={BAR_Y}
            x2={markerX}
            y2={BAR_Y}
            stroke={colors.ACCENT}
            strokeWidth={4.5}
            strokeLinecap="round"
            opacity={0.9 * barU}
          />
          <circle cx={markerX} cy={BAR_Y} r={7} fill={colors.ACCENT} opacity={barU} />
        </g>
      )}

      {/* Equations (top center, crossfading between beats). */}
      <MathLabel
        tex="x_t=\sqrt{\bar\alpha_t}\,x_0+\sqrt{1-\bar\alpha_t}\,\epsilon"
        x={640}
        y={56}
        fontSize={30}
        opacity={s.get(ch.eqU)}
      />
      <MathLabel
        tex="\nabla_x \log p_t(x)"
        x={640}
        y={56}
        fontSize={30}
        color={colors.WARM}
        opacity={s.get(ch.scoreEqU)}
      />

      {/* Finale labels + the two walks between the panels. */}
      {splitU > 0 && (
        <g opacity={splitU}>
          <MathLabel
            tex="\text{data}\;\;x_0"
            x={PANEL.lx}
            y={PANEL.cy + PANEL.h / 2 + 36}
            fontSize={22}
          />
          <MathLabel
            tex="\text{pure noise}\;\;x_T"
            x={PANEL.rx}
            y={PANEL.cy + PANEL.h / 2 + 36}
            fontSize={22}
            color={colors.MUTED}
          />
          <Vec
            x1={GAP_L}
            y1={PANEL.cy - 34}
            x2={GAP_R}
            y2={PANEL.cy - 34}
            grow={linkU}
            color={colors.MUTED}
            width={2.5}
            head={10}
          />
          <text
            x={640}
            y={PANEL.cy - 52}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={17}
          >
            add noise
          </text>
          <Vec
            x1={GAP_R}
            y1={PANEL.cy + 34}
            x2={GAP_L}
            y2={PANEL.cy + 34}
            grow={linkU}
            color={colors.WARM}
            width={2.5}
            head={10}
          />
          <text
            x={640}
            y={PANEL.cy + 66}
            textAnchor="middle"
            fill={colors.WARM}
            fontSize={17}
          >
            denoise
          </text>
        </g>
      )}
    </>
  );
}

export function Diffusion() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={tl} loop motion={MOTION}>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => ({ tl });
