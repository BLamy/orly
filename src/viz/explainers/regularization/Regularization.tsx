import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  BEST_MSE_STR,
  LAMBDA_BEST,
  LAMBDA_BEST_STR,
  N_SUB,
  P,
  PANEL_H,
  PANEL_W,
  PANEL_X0,
  PANEL_Y0,
  SUB_W,
  TRAIN_X,
  TRAIN_Y,
  TRUE_F,
  X_MAIN,
  X_UCURVE,
  Y_MAIN,
  Y_UCURVE,
  avgSubY,
  barH,
  buildScene,
  evalPoly,
  logLamAt,
  testMseAt,
  uCurveF,
  weightsAt,
} from './scene';

/**
 * Regularization — the price of complexity.
 * Pure render: the ridge sweep, the coefficient bars, the U-curve and the
 * dropout ensemble are all module-scope precomputations sampled through the
 * timeline. No local clocks, no randomness at render time.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/regularization/overrides.json', slug: 'regularization' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// the clip box for the main plot (the unpenalized fit spikes off the chart)
const CLIP_X = X_MAIN.range()[0] - 4;
const CLIP_W = X_MAIN.range()[1] - X_MAIN.range()[0] + 8;
const CLIP_Y = Y_MAIN.range()[1] - 4;
const CLIP_H = Y_MAIN.range()[0] - Y_MAIN.range()[1] + 8;

// coefficient bar layout inside the shared right panel
const BAR_BASE = PANEL_Y0 + PANEL_H - 56;
const BAR_MAX_H = PANEL_H - 130;
const BAR_GAP = (PANEL_W - 72) / P;
const BAR_W = BAR_GAP * 0.62;
const barX = (j: number): number => PANEL_X0 + 44 + j * BAR_GAP;

const SUB_COLORS = [
  colors.SECONDARY,
  colors.TEAL,
  colors.WARM,
  colors.ACCENT,
  colors.SECONDARY,
  colors.TEAL,
  colors.WARM,
  colors.ACCENT,
];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const dataU = s.get(scene.dataU);
  const fitU = s.get(scene.fitU);
  const fitOp = s.get(scene.fitOp);
  const lambdaU = s.get(scene.lambdaU);
  const barsU = s.get(scene.barsU);
  const penTexU = s.get(scene.penTexU);
  const lamTagU = s.get(scene.lamTagU);
  const panelU = s.get(scene.panelU);
  const curveU = s.get(scene.curveU);
  const dotU = s.get(scene.dotU);
  const sweetU = s.get(scene.sweetU);
  const subU = s.get(scene.subU);
  const subOp = s.get(scene.subOp);
  const avgU = s.get(scene.avgU);
  const truthU = s.get(scene.truthU);

  // the one persistent centerpiece: the current ridge fit at sweep progress u
  const w = weightsAt(lambdaU);
  const ridgeF = (x: number): number => evalPoly(w, x);

  // the tracking dot on the U-curve
  const dotX = X_UCURVE(logLamAt(lambdaU));
  const dotY = Y_UCURVE(Math.log10(testMseAt(lambdaU)));

  const sweetX = X_UCURVE(Math.log10(LAMBDA_BEST));
  const sweetY = Y_UCURVE(Math.log10(Number(BEST_MSE_STR)));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="reg-plot-clip">
          <rect x={CLIP_X} y={CLIP_Y} width={CLIP_W} height={CLIP_H} />
        </clipPath>
      </defs>

      <Camera {...cam}>
        {/* — the main plot: data + the morphing ridge fit —————————————— */}
        <Axes x={X_MAIN} y={Y_MAIN} reveal={axesU} xTicks={4} yTicks={4} fontSize={12} />

        <g clipPath="url(#reg-plot-clip)">
          {/* the true curve, revealed for the ensemble payoff */}
          <FunctionPlot
            x={X_MAIN}
            y={Y_MAIN}
            f={TRUE_F}
            domain={[-1.05, 1.05]}
            reveal={truthU}
            color={colors.MUTED}
            width={2.2}
            dash
            opacity={0.9}
          />

          {/* the 8 dropout sub-fits (real masked least-squares fits) */}
          {subU > 0 &&
            SUB_W.map((sw, i) => {
              const u = clamp01(subU * (N_SUB + 2) - i) as number;
              if (u <= 0) return null;
              return (
                <FunctionPlot
                  key={i}
                  x={X_MAIN}
                  y={Y_MAIN}
                  f={(x) => evalPoly(sw, x)}
                  domain={[-1.05, 1.05]}
                  reveal={u}
                  color={SUB_COLORS[i]}
                  width={1.6}
                  opacity={0.55 * subOp}
                />
              );
            })}

          {/* their pointwise average — the ensemble */}
          <FunctionPlot
            x={X_MAIN}
            y={Y_MAIN}
            f={avgSubY}
            domain={[-1.05, 1.05]}
            reveal={avgU}
            color={colors.POSITIVE}
            width={3.4}
          />

          {/* THE centerpiece: the ridge fit, morphing through the real sweep */}
          <FunctionPlot
            x={X_MAIN}
            y={Y_MAIN}
            f={ridgeF}
            domain={[-1.05, 1.05]}
            reveal={fitU}
            color={colors.ACCENT}
            width={3}
            opacity={fitOp}
          />
        </g>

        {/* the training points */}
        {dataU > 0 &&
          TRAIN_X.map((x, i) => {
            const u = clamp01(dataU * (TRAIN_X.length + 3) - i);
            if (u <= 0) return null;
            return (
              <circle
                key={i}
                cx={X_MAIN(x)}
                cy={Y_MAIN(TRAIN_Y[i])}
                r={5.5 * u}
                fill={colors.WARM}
                stroke={colors.BG}
                strokeWidth={1.4}
              />
            );
          })}

        {/* — the shared right panel ————————————————————————————————————— */}
        {(barsU > 0 || panelU > 0) && (
          <rect
            x={PANEL_X0}
            y={PANEL_Y0}
            width={PANEL_W}
            height={PANEL_H}
            rx={12}
            fill={colors.PANEL}
            opacity={0.85 * Math.max(barsU, panelU)}
            stroke={colors.GRID}
          />
        )}

        {/* coefficient magnitude bars — driven by the SAME weights as the fit */}
        {barsU > 0 && (
          <g opacity={barsU}>
            <text x={PANEL_X0 + 26} y={PANEL_Y0 + 36} fill={colors.TEXT} fontSize={16}>
              coefficient size (log scale)
            </text>
            <line
              x1={PANEL_X0 + 30}
              y1={BAR_BASE}
              x2={PANEL_X0 + PANEL_W - 30}
              y2={BAR_BASE}
              stroke={colors.GRID}
              strokeWidth={1}
            />
            {w.map((wj, j) => {
              const h = barH(wj) * BAR_MAX_H;
              return (
                <g key={j}>
                  <rect
                    x={barX(j)}
                    y={BAR_BASE - h}
                    width={BAR_W}
                    height={Math.max(h, 1)}
                    rx={2}
                    fill={colors.ACCENT}
                    opacity={0.85}
                  />
                  <text
                    x={barX(j) + BAR_W / 2}
                    y={BAR_BASE + 18}
                    textAnchor="middle"
                    fill={colors.MUTED}
                    fontSize={11}
                  >
                    {`w${j}`}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* the test-error-vs-lambda U-curve */}
        {panelU > 0 && (
          <g opacity={panelU}>
            <text x={PANEL_X0 + 26} y={PANEL_Y0 + 36} fill={colors.TEXT} fontSize={16}>
              error on held-out data
            </text>
            <Axes
              x={X_UCURVE}
              y={Y_UCURVE}
              reveal={panelU}
              xTicks={4}
              yTicks={3}
              xLabel="log λ"
              fontSize={11}
            />
            <FunctionPlot
              x={X_UCURVE}
              y={Y_UCURVE}
              f={uCurveF}
              reveal={curveU}
              color={colors.NEGATIVE}
              width={2.6}
            />
            {dotU > 0 && (
              <circle
                cx={dotX}
                cy={dotY}
                r={7}
                fill={colors.WARM}
                stroke={colors.BG}
                strokeWidth={1.6}
                opacity={dotU}
              />
            )}
            {sweetU > 0 && (
              <g opacity={sweetU}>
                <line
                  x1={sweetX}
                  y1={sweetY - 14}
                  x2={sweetX}
                  y2={Y_UCURVE.range()[0]}
                  stroke={colors.POSITIVE}
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                />
                <circle cx={sweetX} cy={sweetY} r={9} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
                <MathLabel
                  tex={`\\lambda^{*} \\approx ${LAMBDA_BEST_STR}`}
                  x={sweetX + 8}
                  y={sweetY - 44}
                  fontSize={19}
                  color={colors.POSITIVE}
                  opacity={sweetU}
                />
                <MathLabel
                  tex={`\\mathrm{MSE}_{\\text{test}} \\approx ${BEST_MSE_STR}`}
                  x={sweetX + 8}
                  y={sweetY - 16}
                  fontSize={15}
                  color={colors.MUTED}
                  opacity={sweetU}
                />
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* screen-fixed: the penalized loss, top-left over the plot */}
      <MathLabel
        tex="L \;=\; \mathrm{MSE} \;+\; \lambda\,\lVert w\rVert^2"
        x={118}
        y={64}
        anchor="start"
        fontSize={24}
        opacity={penTexU}
      />
      <MathLabel
        tex="(X^{\top}X + \lambda I)\,w = X^{\top}y"
        x={118}
        y={100}
        anchor="start"
        fontSize={16}
        color={colors.MUTED}
        opacity={lamTagU}
      />
    </>
  );
}

export function Regularization() {
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
