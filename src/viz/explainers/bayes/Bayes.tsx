import { MathLabel, Player, colors } from '../../core';
import type { TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import type { SceneState } from '../../core';
import { Brace, ParticleCloud } from '../../primitives';
import {
  BRACE,
  FRAME,
  H_BLOCK,
  POSITIVES,
  SICK_BLOCK,
  TRUE_POS,
  buildScene,
  computeParticles,
} from './scene';

/** Scene built once at module scope — the render below is pure. */
const { tl, ch } = buildScene();
tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/bayes/overrides.json', slug: 'bayes' };
const compute = (s: SceneState) => computeParticles(s, ch);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/* Math sits top-center: the split cluster stays below y ≈ 237. */
const MATH = { x: 640, y: 150 };

/* Beat-5 posterior — a headcount, written down. */
const POSTERIOR_TEX = 'P(\\text{sick}\\mid +)=\\frac{18}{18+178}\\approx 9\\%';

/* Beat-6 general formula. Each overlay repeats the identical layout with the
   base color transparent and ONE factor re-colored, so every highlight
   registers exactly over the base formula (\textcolor changes no metrics). */
const FORMULA_TEX = 'P(\\text{sick}\\mid +)=\\frac{P(+\\mid \\text{sick})\\,P(\\text{sick})}{P(+)}';
const LIK_TEX = `P(\\text{sick}\\mid +)=\\frac{\\textcolor{${colors.WARM}}{P(+\\mid \\text{sick})}\\,P(\\text{sick})}{P(+)}`;
const PRIOR_TEX = `P(\\text{sick}\\mid +)=\\frac{P(+\\mid \\text{sick})\\,\\textcolor{${colors.NEGATIVE}}{P(\\text{sick})}}{P(+)}`;
const EVID_TEX = `P(\\text{sick}\\mid +)=\\frac{P(+\\mid \\text{sick})\\,P(\\text{sick})}{\\textcolor{${colors.ACCENT}}{P(+)}}`;

export function Bayes() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={tl} loop motion={MOTION}>
        {(s) => {
          const frameU = s.get(ch.frameU);
          const braceU = s.get(ch.braceU);
          const dimU = s.get(ch.dimU);
          const splitU = s.get(ch.splitU);
          const countU = s.get(ch.countU);
          const chrome = 1 - dimU; // the frame + brace fade as the negatives dim
          const count = Math.round(TRUE_POS * countU);
          const countO = clamp01(countU * 6);
          const pctO = clamp01((countU - 0.9) / 0.1);
          return (
            <>
              {/* the population frame, under the canvas so the dots draw on top */}
              {frameU > 0.001 && (
                <rect
                  x={FRAME.x}
                  y={FRAME.y}
                  width={FRAME.w}
                  height={FRAME.h}
                  rx={FRAME.rx}
                  fill={colors.PANEL}
                  stroke={colors.GRID}
                  strokeWidth={1.5}
                  opacity={frameU * (0.15 + 0.85 * chrome)}
                />
              )}

              {/* all 2,000 people */}
              <ParticleCloud state={s} compute={compute} alpha={1} />

              {/* the prior, braced — the horizontal Brace rotated to run beside the column */}
              {braceU > 0.001 && chrome > 0.01 && (
                <>
                  <g transform={`translate(${BRACE.x}, ${BRACE.cy}) rotate(90)`}>
                    <Brace
                      x0={-BRACE.half}
                      x1={BRACE.half}
                      y={0}
                      u={braceU}
                      color={colors.NEGATIVE}
                      opacity={chrome}
                    />
                  </g>
                  <text
                    transform={`rotate(-90 88 ${BRACE.cy})`}
                    x={88}
                    y={BRACE.cy}
                    textAnchor="middle"
                    fill={colors.NEGATIVE}
                    fontSize={17}
                    opacity={braceU * chrome}
                  >
                    1% actually sick — the prior
                  </text>
                </>
              )}

              {/* beat-5 block labels + the live headcount */}
              {splitU > 0.01 && (
                <>
                  <text
                    x={SICK_BLOCK.cx}
                    y={SICK_BLOCK.cy + 62}
                    textAnchor="middle"
                    fill={colors.NEGATIVE}
                    fontSize={16}
                    opacity={splitU}
                  >
                    actually sick
                  </text>
                  <text
                    x={H_BLOCK.cx}
                    y={H_BLOCK.cy + 118}
                    textAnchor="middle"
                    fill={colors.WARM}
                    fontSize={16}
                    opacity={splitU}
                  >
                    false alarms
                  </text>
                </>
              )}
              {countO > 0.01 && (
                <text
                  x={SICK_BLOCK.cx}
                  y={248}
                  textAnchor="middle"
                  fill={colors.TEXT}
                  fontSize={26}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  opacity={countO}
                >
                  {count} / {POSITIVES}
                  <tspan fill={colors.NEGATIVE} fillOpacity={pctO}>
                    {'  ≈ 9%'}
                  </tspan>
                </text>
              )}

              {/* beat-5 posterior, then the beat-6 formula with its factor pulses */}
              <MathLabel tex={POSTERIOR_TEX} x={MATH.x} y={MATH.y} fontSize={30} display opacity={s.get(ch.mathU)} />
              <MathLabel tex={FORMULA_TEX} x={MATH.x} y={MATH.y} fontSize={30} display opacity={s.get(ch.formulaU)} />
              <MathLabel
                tex={LIK_TEX}
                x={MATH.x}
                y={MATH.y}
                fontSize={30}
                display
                color="transparent"
                opacity={s.get(ch.formulaU) * s.get(ch.hlLik)}
              />
              <MathLabel
                tex={PRIOR_TEX}
                x={MATH.x}
                y={MATH.y}
                fontSize={30}
                display
                color="transparent"
                opacity={s.get(ch.formulaU) * s.get(ch.hlPrior)}
              />
              <MathLabel
                tex={EVID_TEX}
                x={MATH.x}
                y={MATH.y}
                fontSize={30}
                display
                color="transparent"
                opacity={s.get(ch.formulaU) * s.get(ch.hlEvid)}
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}
