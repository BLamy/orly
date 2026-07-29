import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  HINGES,
  LOG_MAX,
  LOSS_PANEL,
  NET_DOMAIN,
  SNAP_EPOCHS,
  TARGET,
  TRAINING,
  buildScene,
  composed,
  epochAt,
  hingeSum,
  line1,
  lossAt,
  lossLogCurve,
  netCurve,
  relu,
  xLoss,
  xScale,
  yLoss,
  yScale,
} from './scene';

/**
 * Activation Functions — why depth needs bends.
 * Pure render: every visual value comes from the sampled SceneState or a
 * module-scope precomputation (including the actual training run) in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/activation-functions/overrides.json',
  slug: 'activation-functions',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const FINAL_NET = netCurve(SNAP_EPOCHS.length - 1);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const linOp = s.get(scene.linOp);
  const line1U = s.get(scene.line1U);
  const compU = s.get(scene.compU);
  const compMorph = s.get(scene.compMorph);

  const hingeOp = s.get(scene.hingeOp);
  const reluU = s.get(scene.reluU);
  const sumM = s.get(scene.sumM);
  const kinkU = s.get(scene.kinkU);

  const targetU = s.get(scene.targetU);
  const netU = s.get(scene.netU);
  const snapU = s.get(scene.snapU);
  const panelU = s.get(scene.panelU);
  const bendsU = s.get(scene.bendsU);

  const net = netCurve(snapU);
  const epoch = epochAt(snapU);
  const mse = lossAt(epoch);
  // the inset curve reveals in lockstep with the training progress
  const lossReveal = clamp01(Math.log10(epoch + 1) / LOG_MAX);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <Axes x={xScale} y={yScale} reveal={axesU} grid xTicks={8} yTicks={6} fontSize={12} />

        {/* — Beat 1 · two linear layers, composed — */}
        {linOp > 0 && (
          <g opacity={linOp}>
            <FunctionPlot
              x={xScale}
              y={yScale}
              f={line1}
              reveal={line1U}
              color={colors.ACCENT}
              width={3}
            />
            <FunctionPlot
              x={xScale}
              y={yScale}
              f={composed}
              morph={{ from: line1, u: compMorph }}
              reveal={compU}
              color={colors.WARM}
              width={3}
            />
            <MathLabel
              tex="f_1(x)=a_1x+b_1"
              x={xScale(1.75)}
              y={yScale(line1(1.75)) - 28}
              fontSize={19}
              color={colors.ACCENT}
              opacity={s.get(scene.line1TexU) * line1U}
            />
            <MathLabel
              tex="f_2(f_1(x))"
              x={xScale(-1.75)}
              y={yScale(composed(-1.75)) - 30}
              fontSize={19}
              color={colors.WARM}
              opacity={compMorph * compU}
            />
          </g>
        )}

        {/* — Beat 2 · the hinge, then a sum of hinges — */}
        {hingeOp > 0 && (
          <g opacity={hingeOp}>
            <FunctionPlot
              x={xScale}
              y={yScale}
              f={relu}
              reveal={reluU}
              color={colors.POSITIVE}
              width={3}
              opacity={sumM > 0 ? Math.max(0.25, 1 - sumM) : 1}
            />
            {sumM > 0 && (
              <FunctionPlot
                x={xScale}
                y={yScale}
                f={(x) => hingeSum(x, sumM)}
                reveal={clamp01(sumM * 3)}
                color={colors.TEAL}
                width={3}
              />
            )}
            {kinkU > 0 &&
              HINGES.map((h, i) => {
                const on = clamp01(sumM - i);
                if (on <= 0) return null;
                return (
                  <circle
                    key={i}
                    cx={xScale(h.k)}
                    cy={yScale(hingeSum(h.k, sumM))}
                    r={6}
                    fill={colors.BG}
                    stroke={colors.WARM}
                    strokeWidth={2.4}
                    opacity={kinkU * on}
                  />
                );
              })}
          </g>
        )}

        {/* — Beat 3 · a real 1-16-1 network fits the target — */}
        {targetU > 0 && (
          <g>
            <FunctionPlot
              x={xScale}
              y={yScale}
              f={TARGET}
              domain={[...NET_DOMAIN]}
              reveal={targetU}
              color={colors.MUTED}
              width={2.6}
              dash
            />
            <text
              x={xScale(-1.95)}
              y={yScale(TARGET(-1.95)) - 16}
              fill={colors.MUTED}
              fontSize={15}
              fontStyle="italic"
              opacity={targetU}
            >
              target
            </text>
          </g>
        )}
        {netU > 0 && (
          <FunctionPlot
            x={xScale}
            y={yScale}
            f={net}
            domain={[...NET_DOMAIN]}
            samples={200}
            reveal={netU}
            color={colors.ACCENT}
            width={3.2}
          />
        )}
        {bendsU > 0 &&
          TRAINING.bends.map((b, i) => (
            <g key={i} opacity={bendsU}>
              <line
                x1={xScale(b)}
                y1={yScale(FINAL_NET(b)) + 12}
                x2={xScale(b)}
                y2={yScale(FINAL_NET(b)) + 30}
                stroke={colors.WARM}
                strokeWidth={2}
              />
              <circle
                cx={xScale(b)}
                cy={yScale(FINAL_NET(b))}
                r={5.5}
                fill={colors.BG}
                stroke={colors.WARM}
                strokeWidth={2.2}
              />
            </g>
          ))}
      </Camera>

      {/* screen-fixed labels (clear of the caption lower-third) */}
      <MathLabel
        tex="a_2(a_1x+b_1)+b_2=(a_2a_1)\,x+(a_2b_1+b_2)"
        x={STAGE_W / 2}
        y={52}
        fontSize={22}
        color={colors.WARM}
        opacity={s.get(scene.collapseTexU)}
      />
      <MathLabel
        tex="\mathrm{ReLU}(x)=\max(0,\,x)"
        x={STAGE_W / 2}
        y={52}
        fontSize={24}
        color={colors.POSITIVE}
        opacity={s.get(scene.reluTexU)}
      />
      <MathLabel
        tex="\textstyle\sum_i c_i\,\mathrm{ReLU}(x-k_i)"
        x={STAGE_W / 2}
        y={52}
        fontSize={22}
        color={colors.TEAL}
        opacity={s.get(scene.sumTexU)}
      />
      <MathLabel
        tex="\hat y_\theta(x)\;=\;\text{a 1-16-1 ReLU net}"
        x={430}
        y={52}
        fontSize={20}
        color={colors.ACCENT}
        opacity={s.get(scene.netTexU)}
      />

      {/* the loss inset: the REAL training curve */}
      {panelU > 0 && (
        <g opacity={panelU}>
          <rect
            x={LOSS_PANEL.x}
            y={LOSS_PANEL.y}
            width={LOSS_PANEL.w}
            height={LOSS_PANEL.h}
            rx={12}
            fill={colors.PANEL}
            opacity={0.88}
            stroke={colors.GRID}
          />
          <text x={LOSS_PANEL.x + 22} y={LOSS_PANEL.y + 28} fill={colors.TEXT} fontSize={15}>
            loss per epoch
          </text>
          <Axes x={xLoss} y={yLoss} reveal={panelU} xTicks={3} yTicks={3} fontSize={10} />
          <FunctionPlot
            x={xLoss}
            y={yLoss}
            f={lossLogCurve}
            reveal={lossReveal}
            color={colors.NEGATIVE}
            width={2.6}
          />
          {lossReveal > 0 && (
            <circle
              cx={xLoss(Math.log10(epoch + 1))}
              cy={yLoss(Math.log10(mse))}
              r={5}
              fill={colors.NEGATIVE}
              stroke={colors.BG}
              strokeWidth={1.5}
            />
          )}
          <text
            x={LOSS_PANEL.x + LOSS_PANEL.w - 22}
            y={LOSS_PANEL.y + 28}
            textAnchor="end"
            fill={colors.MUTED}
            fontSize={13}
          >
            {`epoch ${Math.round(epoch)} · mse ${mse.toFixed(3)}`}
          </text>
        </g>
      )}
    </>
  );
}

export function ActivationFunctions() {
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
