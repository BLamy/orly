import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  BEST_DEG,
  MAX_DEG,
  PANEL_H,
  PANEL_W,
  PANEL_X,
  PANEL_Y,
  TEST_MSE,
  TRAIN_MSE,
  TRUE_F,
  buildScene,
  clipped,
  fitAt,
  testLogErr,
  testX,
  testY,
  trainLogErr,
  trainX,
  trainY,
  xDeg,
  xScale,
  yErr,
  yScale,
} from './scene';

/**
 * Overfitting — memorizing vs learning.
 * Pure render: every visual value comes from the sampled SceneState or the
 * module-scope least-squares fits in scene.ts. No clocks, no randomness.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/overfitting/overrides.json', slug: 'overfitting' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const PT_STAGGER = 0.6;
const ptEnter = (u: number, i: number, n: number): number =>
  clamp01(u * (1 + PT_STAGGER) - (i / (n - 1)) * PT_STAGGER);

/** Live error readout formatting — fixed width so it doesn't jitter. */
const fmtErr = (v: number): string => v.toFixed(4);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const ptsU = s.get(scene.ptsU);
  const truthU = s.get(scene.truthU);
  const fitU = s.get(scene.fitU);
  const degF = s.get(scene.degF);
  const degLabelU = s.get(scene.degLabelU);
  const errReadU = s.get(scene.errReadU);
  const testU = s.get(scene.testU);
  const missU = s.get(scene.missU);
  const panelU = s.get(scene.panelU);
  const trainCurveU = s.get(scene.trainCurveU);
  const testCurveU = s.get(scene.testCurveU);
  const sweetU = s.get(scene.sweetU);
  const mainDim = s.get(scene.mainDim);
  const closeU = s.get(scene.closeU);

  const degShown = Math.round(degF);
  const fit = (x: number) => clipped(fitAt(degF, x));
  // live train error at the (fractional) degree — real values, log-lerped
  const liveTrain = 10 ** trainLogErr(degF);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainDim}>
        <Camera {...cam}>
          <Axes x={xScale} y={yScale} reveal={axesU} xTicks={6} yTicks={5} xLabel="x" yLabel="y" />

          {/* the hidden truth — a dashed ghost */}
          <FunctionPlot
            x={xScale}
            y={yScale}
            f={TRUE_F}
            reveal={truthU > 0 ? 1 : 0}
            color={colors.MUTED}
            width={2}
            dash
            opacity={0.75 * Math.min(1, truthU)}
          />
          {truthU > 0.05 && (
            <text
              x={xScale(-0.72)}
              y={yScale(TRUE_F(-0.72)) - 22}
              fill={colors.MUTED}
              fontSize={16}
              fontStyle="italic"
              opacity={Math.min(1, truthU)}
            >
              the hidden truth
            </text>
          )}

          {/* residual whiskers: how far the current fit misses each test point */}
          {missU > 0 &&
            testX.map((x, i) => (
              <line
                key={i}
                x1={xScale(x)}
                y1={yScale(testY[i])}
                x2={xScale(x)}
                y2={yScale(fit(x))}
                stroke={colors.NEGATIVE}
                strokeWidth={2.4}
                strokeDasharray="4 3"
                opacity={0.8 * missU}
              />
            ))}

          {/* the fitted polynomial — morphs through the real fits as degF moves */}
          <FunctionPlot
            x={xScale}
            y={yScale}
            f={fit}
            samples={280}
            reveal={fitU}
            color={colors.ACCENT}
            width={3}
          />

          {/* the twelve training points */}
          {trainX.map((x, i) => {
            const u = ptEnter(ptsU, i, trainX.length);
            if (u <= 0) return null;
            return (
              <circle
                key={i}
                cx={xScale(x)}
                cy={yScale(trainY[i])}
                r={6.5 * u}
                fill={colors.WARM}
                stroke={colors.BG}
                strokeWidth={1.5}
              />
            );
          })}

          {/* the held-out test points */}
          {testX.map((x, i) => {
            const u = ptEnter(testU, i, testX.length);
            if (u <= 0) return null;
            return (
              <g key={i} opacity={u}>
                <circle
                  cx={xScale(x)}
                  cy={yScale(testY[i]) - 26 * (1 - u)}
                  r={6.5}
                  fill={colors.POSITIVE}
                  stroke={colors.BG}
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </Camera>

        {/* screen-fixed: the degree dial + live train error */}
        <g opacity={degLabelU}>
          <rect x={100} y={26} width={188} height={44} rx={10} fill={colors.PANEL} opacity={0.9} stroke={colors.GRID} />
          <text x={118} y={54} fill={colors.TEXT} fontSize={19}>
            degree
          </text>
          <text x={252} y={55} textAnchor="end" fill={colors.ACCENT} fontSize={24} fontWeight={700}>
            {degShown}
          </text>
        </g>
        <g opacity={errReadU}>
          <rect x={306} y={26} width={252} height={44} rx={10} fill={colors.PANEL} opacity={0.9} stroke={colors.GRID} />
          <text x={324} y={54} fill={colors.TEXT} fontSize={17}>
            train error
          </text>
          <text x={540} y={54} textAnchor="end" fill={colors.WARM} fontSize={19} fontFamily="ui-monospace, monospace">
            {fmtErr(liveTrain)}
          </text>
        </g>

        {/* legend chips for the two point families */}
        <g opacity={0.9 * Math.min(1, ptsU)}>
          <circle cx={628} cy={44} r={6} fill={colors.WARM} />
          <text x={642} y={49} fill={colors.MUTED} fontSize={15}>
            training
          </text>
        </g>
        {testU > 0 && (
          <g opacity={0.9 * Math.min(1, testU)}>
            <circle cx={742} cy={44} r={6} fill={colors.POSITIVE} />
            <text x={756} y={49} fill={colors.MUTED} fontSize={15}>
              held out
            </text>
          </g>
        )}
      </g>

      {/* the error-vs-degree panel: train falls, test makes the U */}
      {panelU > 0 && (
        <g opacity={panelU}>
          <rect
            x={PANEL_X}
            y={PANEL_Y}
            width={PANEL_W}
            height={PANEL_H}
            rx={12}
            fill={colors.PANEL}
            opacity={0.88}
            stroke={colors.GRID}
          />
          <text x={PANEL_X + 26} y={PANEL_Y + 38} fill={colors.TEXT} fontSize={17}>
            error vs degree (log scale)
          </text>
          <g opacity={trainCurveU}>
            <rect x={PANEL_X + 26} y={PANEL_Y + 60} width={18} height={4} rx={2} fill={colors.WARM} />
            <text x={PANEL_X + 52} y={PANEL_Y + 66} fill={colors.TEXT} fontSize={14}>
              train
            </text>
          </g>
          <g opacity={testCurveU}>
            <rect x={PANEL_X + 126} y={PANEL_Y + 60} width={18} height={4} rx={2} fill={colors.POSITIVE} />
            <text x={PANEL_X + 152} y={PANEL_Y + 66} fill={colors.TEXT} fontSize={14}>
              test
            </text>
          </g>
          <Axes x={xDeg} y={yErr} reveal={panelU} xTicks={6} yTicks={4} xLabel="degree" fontSize={11} />
          <FunctionPlot
            x={xDeg}
            y={yErr}
            f={trainLogErr}
            samples={200}
            reveal={trainCurveU}
            color={colors.WARM}
            width={2.6}
          />
          <FunctionPlot
            x={xDeg}
            y={yErr}
            f={testLogErr}
            samples={200}
            reveal={testCurveU}
            color={colors.POSITIVE}
            width={2.6}
          />
          {/* dots at the integer degrees — these are the actual measurements */}
          {trainCurveU > 0.95 &&
            TRAIN_MSE.map((v, d) =>
              d < 1 ? null : (
                <circle key={d} cx={xDeg(d)} cy={yErr(Math.log10(v))} r={3.2} fill={colors.WARM} opacity={trainCurveU} />
              ),
            )}
          {testCurveU > 0.95 &&
            TEST_MSE.map((v, d) =>
              d < 1 ? null : (
                <circle key={d} cx={xDeg(d)} cy={yErr(Math.log10(v))} r={3.2} fill={colors.POSITIVE} opacity={testCurveU} />
              ),
            )}
          {/* the sweet spot — argmin of the real test error */}
          {sweetU > 0 && (
            <g opacity={sweetU}>
              <line
                x1={xDeg(BEST_DEG)}
                y1={yErr(Math.log10(TEST_MSE[BEST_DEG])) - 14}
                x2={xDeg(BEST_DEG)}
                y2={PANEL_Y + 96}
                stroke={colors.TEXT}
                strokeWidth={1.4}
                strokeDasharray="3 3"
                opacity={0.7}
              />
              <circle
                cx={xDeg(BEST_DEG)}
                cy={yErr(Math.log10(TEST_MSE[BEST_DEG]))}
                r={9}
                fill="none"
                stroke={colors.TEXT}
                strokeWidth={2}
              />
              <text
                x={xDeg(BEST_DEG)}
                y={PANEL_Y + 88}
                textAnchor="middle"
                fill={colors.TEXT}
                fontSize={15}
                fontStyle="italic"
              >
                sweet spot
              </text>
            </g>
          )}
        </g>
      )}

      {/* clean ending — opaque-ish closing card over the dimmed stage */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <MathLabel
            tex="\text{train error} \downarrow \quad\quad \text{test error} \cup"
            x={STAGE_W / 2}
            y={300}
            fontSize={30}
            color={colors.TEXT}
          />
          <text x={STAGE_W / 2} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={21}>
            learning is judged on the data you haven't seen
          </text>
        </g>
      )}
    </>
  );
}

export function Overfitting() {
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
