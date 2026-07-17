import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  HIST4,
  HIST8,
  HIST8_OUT,
  HIST_BINS,
  HIST_H,
  HIST_MAX,
  HIST_RANGE,
  HIST_W,
  HIST_X0,
  HIST_Y0,
  LINE_X0,
  LINE_X1,
  LINE_Y,
  N,
  Q4,
  Q8,
  Q8_OUT,
  RMSE_CLEAN,
  RMSE_OUT,
  W,
  buildScene,
  valX,
} from './scene';

/**
 * Quantization — pure render. Dot positions, comb teeth, and histograms are
 * the actual absmax int8/int4 quantizations computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/quantization/overrides.json', slug: 'quantization' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// deterministic vertical jitter per weight (render-only, index-hashed)
const jitter = (i: number): number => ((i * 2654435761) % 97) / 97 - 0.5;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const gridU8 = s.get(scene.gridU8);
  const snapU = s.get(scene.snapU);
  const bits = s.get(scene.bits);
  const histU = s.get(scene.histU);
  const outU = s.get(scene.outU);
  const statU = s.get(scene.statU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const toInt4 = clamp01((8 - bits) / 4); // 0 at int8, 1 at int4
  // dot targets: true → int8 dq → int4 dq → (outlier) int8-with-outlier dq
  const dotVal = (i: number): number => {
    let v = lerp(W[i], lerp(Q8.dq[i], Q4.dq[i], toInt4), snapU);
    if (outU > 0) v = lerp(v, Q8_OUT.dq[i], outU);
    return v;
  };
  // comb teeth for the current grid
  const teethStep = outU > 0.5 ? Q8_OUT.scale / 127 : lerp(Q8.scale / 127, Q4.scale / 7, toInt4);
  const nTeeth = Math.floor(1.6 / teethStep);
  const rmse = outU > 0.5 ? RMSE_OUT : lerp(Q8.rmse, Q4.rmse, toInt4);
  const histNow = outU > 0.5 ? HIST8_OUT : toInt4 > 0.5 ? HIST4 : HIST8;
  const histColor = outU > 0.5 ? colors.WARM : toInt4 > 0.5 ? colors.NEGATIVE : colors.ACCENT;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the number line */}
          <line x1={LINE_X0 - 20} y1={LINE_Y} x2={LINE_X1 + 20} y2={LINE_Y} stroke={colors.GRID} strokeWidth={1.5} opacity={dotsU} />
          {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((v) => (
            <g key={v} opacity={dotsU}>
              <line x1={valX(v)} y1={LINE_Y - 5} x2={valX(v)} y2={LINE_Y + 5} stroke={colors.MUTED} />
              <text x={valX(v)} y={LINE_Y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                {v}
              </text>
            </g>
          ))}

          {/* the comb — allowed values */}
          {gridU8 > 0 &&
            Array.from({ length: 2 * nTeeth + 1 }, (_, k) => {
              const v = (k - nTeeth) * teethStep;
              return (
                <line
                  key={k}
                  x1={valX(v)}
                  y1={LINE_Y - 34}
                  x2={valX(v)}
                  y2={LINE_Y - 14}
                  stroke={colors.SECONDARY}
                  strokeWidth={toInt4 > 0.5 ? 2 : 1}
                  opacity={0.55 * gridU8}
                />
              );
            })}
          {gridU8 > 0 && (
            <text x={LINE_X0} y={LINE_Y - 46} fill={colors.SECONDARY} fontSize={13} opacity={gridU8}>
              {outU > 0.5
                ? 'int8 comb, stretched by the outlier'
                : toInt4 > 0.5
                  ? 'int4 — 15 allowed values'
                  : 'int8 — 255 allowed values'}
            </text>
          )}

          {/* the weights */}
          {W.map((_, i) => {
            const u = clamp01(dotsU * 1.5 - i / N);
            if (u <= 0) return null;
            const v = dotVal(i);
            return (
              <circle
                key={i}
                cx={valX(Math.max(-1.55, Math.min(1.55, v)))}
                cy={LINE_Y + 48 + jitter(i) * 56}
                r={3}
                fill={i === 0 && outU > 0.3 ? colors.WARM : colors.ACCENT}
                opacity={0.65 * u}
              />
            );
          })}
          {/* the outlier, off the right edge */}
          {outU > 0.1 && (
            <g opacity={outU}>
              <text x={LINE_X1 + 30} y={LINE_Y + 52} textAnchor="end" fill={colors.WARM} fontSize={14}>
                one weight at 5.0 →
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* error histogram — screen-fixed lower panel */}
      {histU > 0 && (
        <g opacity={histU * dimU}>
          {histNow.map((c, b) => {
            const h = (c / HIST_MAX) * HIST_H;
            return (
              <rect
                key={b}
                x={HIST_X0 + (b / HIST_BINS) * HIST_W}
                y={HIST_Y0 - h}
                width={HIST_W / HIST_BINS - 3}
                height={Math.max(0.5, h)}
                rx={3}
                fill={histColor}
                opacity={0.85}
              />
            );
          })}
          <line x1={HIST_X0 - 10} y1={HIST_Y0} x2={HIST_X0 + HIST_W + 10} y2={HIST_Y0} stroke={colors.GRID} />
          <text x={HIST_X0} y={HIST_Y0 + 22} fill={colors.MUTED} fontSize={13}>
            {`rounding error per weight, ±${HIST_RANGE.toFixed(2)}`}
          </text>
        </g>
      )}

      {/* stat panel */}
      {statU > 0 && (
        <g opacity={statU * dimU}>
          <rect x={952} y={430} width={262} height={96} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={972} y={462} fill={colors.TEXT} fontSize={15}>
            {outU > 0.5
              ? 'int8 + outlier'
              : toInt4 > 0.5
                ? 'int4 — 15 levels'
                : 'int8 — 255 levels'}
          </text>
          <text x={972} y={492} fill={histColor} fontSize={16} fontWeight={600}>
            {`typical error ${rmse.toFixed(4)}`}
          </text>
          {outU > 0.5 && (
            <text x={972} y={514} fill={colors.MUTED} fontSize={12.5}>
              {`was ${RMSE_CLEAN.toFixed(4)} without it`}
            </text>
          )}
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Quantization
          </text>
          <MathLabel
            tex={'\\hat{w} = \\mathrm{round}\\!\\big(w \\cdot \\tfrac{127}{\\max|w|}\\big) \\cdot \\tfrac{\\max|w|}{127}'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            int8 error 0.003 · int4 error 0.062 · one outlier triples everyone's noise
          </text>
        </g>
      )}
    </>
  );
}

export function Quantization() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
