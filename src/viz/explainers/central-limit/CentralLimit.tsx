import { scaleLinear } from 'd3';
import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { FunctionPlot, NumberLine, ParticleCloud } from '../../primitives';
import {
  BASE_Y,
  DIE_BAR_H,
  DIE_BAR_W,
  buildScene,
  computeParticles,
  dieScale,
  gaussPdf,
  zx,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const { ch } = scene;
const compute = (s: SceneState) => computeParticles(s, ch);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** Vertical scale for the Gaussian overlay: px of stack height above BASE_Y. */
const hy = scaleLinear([0, 260], [BASE_Y, BASE_Y - 260]);

/** The N badge, crossfaded from the blend channels (no channel of its own). */
const N_LABELS = [
  { n: 'N = 1', sub: 'die per roll' },
  { n: 'N = 2', sub: 'dice per roll' },
  { n: 'N = 5', sub: 'dice per roll' },
  { n: 'N = 30', sub: 'dice per roll' },
];

/** Pure render: SceneState in, SVG + canvas out. */
function renderFrame(s: SceneState) {
  const dieReveal = s.get(ch.dieReveal);
  const dieLineU = s.get(ch.dieLineU);
  const dieBarsU = s.get(ch.dieBarsU);
  const axisU = s.get(ch.axisU);
  const drop = s.get(ch.drop);
  const u12 = clamp01(s.get(ch.m12));
  const u25 = clamp01(s.get(ch.m25));
  const u530 = clamp01(s.get(ch.m530));
  const gaussReveal = s.get(ch.gaussReveal);
  const glow = s.get(ch.gaussGlow);
  const gA = s.get(ch.gaussA);

  const rainU = Math.min(1, drop * 6); // N badge appears with the rain
  const labelU = [rainU * (1 - u12), u12 * (1 - u25), u25 * (1 - u530), u530];

  return (
    <Camera {...s.get(ch.cam)}>
      {/* beat 1: the die's own number line, faces 1..6 */}
      {dieLineU > 0.002 && (
        <NumberLine scale={dieScale} y={BASE_Y} reveal={dieReveal} ticks={6} opacity={dieLineU} fontSize={17} />
      )}

      {/* beat 1: the exact distribution — six equal bars popping in */}
      {dieBarsU > 0.002 && (
        <g opacity={dieBarsU}>
          {ch.barPop.map((bp, k) => {
            const u = s.get(bp);
            const h = Math.max(0, DIE_BAR_H * u);
            return (
              <rect
                key={k}
                x={dieScale(k + 1) - DIE_BAR_W / 2}
                y={BASE_Y - h}
                width={DIE_BAR_W}
                height={h}
                rx={4}
                fill={colors.WARM}
                opacity={0.85 * clamp01(u * 2)}
              />
            );
          })}
          <MathLabel
            tex="P(\text{any face}) = \tfrac{1}{6}"
            x={640}
            y={380}
            fontSize={24}
            opacity={s.get(ch.dieTexU) * dieBarsU}
          />
        </g>
      )}

      {/* the shared standardized axis (takes over from the die line at N = 2) */}
      {axisU > 0.002 && (
        <g>
          <NumberLine scale={zx} y={BASE_Y} reveal={axisU} ticks={7} fontSize={15} />
          <text
            x={640}
            y={612}
            textAnchor="middle"
            fill={colors.MUTED}
            fontSize={14}
            opacity={clamp01(axisU * 2 - 1)}
          >
            standard deviations from the mean
          </text>
        </g>
      )}

      {/* 900 dice sums: rain, stack, and re-target between layouts */}
      <ParticleCloud state={s} compute={compute} alpha={1} />

      {/* the Gaussian overlay — faint suitor at N = 5, resident at N = 30 */}
      {gaussReveal > 0 && (
        <FunctionPlot
          x={zx}
          y={hy}
          f={(z) => gA * gaussPdf(z)}
          domain={[-3.4, 3.4]}
          samples={200}
          reveal={gaussReveal}
          color={colors.ACCENT}
          width={2.5 + glow}
          opacity={0.35 + 0.65 * glow}
        />
      )}

      {/* the N badge, crossfading with the blend channels */}
      {rainU > 0.002 && (
        <g>
          {N_LABELS.map((l, k) =>
            labelU[k] > 0.002 ? (
              <g key={l.n} opacity={labelU[k]}>
                <text x={252} y={152} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={600}>
                  {l.n}
                </text>
                <text x={252} y={178} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                  {l.sub}
                </text>
              </g>
            ) : null,
          )}
        </g>
      )}

      {/* the theorem, once it has earned the screen time */}
      <MathLabel
        tex="\frac{\bar X-\mu}{\sigma/\sqrt{n}}\;\xrightarrow{d}\;\mathcal N(0,1)"
        x={640}
        y={108}
        fontSize={30}
        opacity={s.get(ch.clTexU)}
      />
    </Camera>
  );
}

export function CentralLimit() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/central-limit/overrides.json', slug: 'central-limit' }}
      >
        {renderFrame}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
