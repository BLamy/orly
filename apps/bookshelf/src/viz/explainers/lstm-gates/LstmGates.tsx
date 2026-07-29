import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CELL_CX,
  CELL_CY,
  LSTM,
  LSTM_FINAL,
  MARKS,
  N,
  RNN_FINAL,
  RNN_STATE,
  buildScene,
  stateY,
  stepX,
} from './scene';

/**
 * LSTM Gates — pure render. The two traces are the exact LSTM and tanh-RNN
 * runs computed in scene.ts on the same marker-then-noise sequence.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/lstm-gates/overrides.json', slug: 'lstm-gates' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function trace(points: number[], upTo: number): string {
  const n = Math.max(2, Math.min(points.length, Math.ceil(upTo) + 1));
  return points
    .slice(0, n)
    .map((v, t) => `${t === 0 ? 'M' : 'L'}${stepX(t).toFixed(1)} ${stateY(v).toFixed(1)}`)
    .join('');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cellU = s.get(scene.cellU);
  const gateHi = s.get(scene.gateHi);
  const runU = s.get(scene.runU);
  const rnnU = s.get(scene.rnnU);
  const readU = s.get(scene.readU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const ri = Math.min(N, Math.max(0, runU));
  const fGlow = gateHi >= 0.5 && gateHi < 1.5 ? 1 : 0.35;
  const iGlow = gateHi >= 1.5 ? 1 : 0.35;
  // the belt: cell state value at the playhead
  const cNow = LSTM.c[Math.floor(ri)];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* — the cell anatomy: a conveyor belt with two gates — */}
          <g opacity={cellU}>
            {/* belt */}
            <line
              x1={CELL_CX - 330}
              y1={CELL_CY}
              x2={CELL_CX + 330}
              y2={CELL_CY}
              stroke={colors.ACCENT}
              strokeWidth={5}
              opacity={0.9}
            />
            <text x={CELL_CX - 330} y={CELL_CY - 16} fill={colors.ACCENT} fontSize={14}>
              cell state — the conveyor belt
            </text>
            {/* forget gate: a multiply sitting ON the belt */}
            <g opacity={fGlow}>
              <circle cx={CELL_CX - 130} cy={CELL_CY} r={22} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
              <text x={CELL_CX - 130} y={CELL_CY + 6} textAnchor="middle" fill={colors.WARM} fontSize={18}>
                ×
              </text>
              <text x={CELL_CX - 130} y={CELL_CY + 46} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                forget gate ≈ 0.998
              </text>
            </g>
            {/* input gate: an add feeding the belt */}
            <g opacity={iGlow}>
              <circle cx={CELL_CX + 110} cy={CELL_CY} r={22} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
              <text x={CELL_CX + 110} y={CELL_CY + 6} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>
                +
              </text>
              <line
                x1={CELL_CX + 110}
                y1={CELL_CY + 78}
                x2={CELL_CX + 110}
                y2={CELL_CY + 24}
                stroke={colors.POSITIVE}
                strokeWidth={2.5}
              />
              <text x={CELL_CX + 110} y={CELL_CY + 98} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                input gate — shut for noise, open for the marker
              </text>
            </g>
            {/* live belt value while running */}
            {runU > 0 && (
              <g>
                <circle cx={CELL_CX + 250} cy={CELL_CY} r={13} fill={colors.ACCENT} opacity={0.4 + 0.6 * Math.abs(cNow)} />
                <text x={CELL_CX + 250} y={CELL_CY - 22} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                  {`c = ${cNow.toFixed(2)}`}
                </text>
              </g>
            )}
          </g>

          {/* — the state plot — */}
          <g opacity={cellU}>
            <line x1={stepX(0)} y1={stateY(0)} x2={stepX(N)} y2={stateY(0)} stroke={colors.GRID} />
            <line x1={stepX(0)} y1={stateY(1)} x2={stepX(N)} y2={stateY(1)} stroke={colors.GRID} strokeDasharray="4 6" />
            <text x={stepX(0) - 10} y={stateY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              1
            </text>
            <text x={stepX(0) - 10} y={stateY(0) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
              0
            </text>
            {/* the marker + noise inputs as ticks */}
            {Array.from({ length: N }, (_, t) => (
              <g key={t}>
                <line
                  x1={stepX(t + 0.5)}
                  y1={stateY(0) + (MARKS[t] ? 0 : 4)}
                  x2={stepX(t + 0.5)}
                  y2={stateY(0) + (MARKS[t] ? -46 : 14)}
                  stroke={MARKS[t] ? colors.WARM : colors.GRID}
                  strokeWidth={MARKS[t] ? 3 : 1.5}
                  opacity={cellU}
                />
                {MARKS[t] === 1 && (
                  <text x={stepX(t + 0.5)} y={stateY(0) - 54} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                    the clue
                  </text>
                )}
              </g>
            ))}
            <text x={stepX(N / 2)} y={stateY(0) + 34} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
              sixteen steps of noise
            </text>
          </g>

          {/* LSTM cell-state trace */}
          {runU > 0 && (
            <g>
              <path d={trace(LSTM.c, ri)} fill="none" stroke={colors.ACCENT} strokeWidth={3.5} />
              <circle cx={stepX(ri)} cy={stateY(LSTM.c[Math.min(N, Math.round(ri))])} r={7} fill={colors.ACCENT} />
              {runU >= N - 0.2 && (
                <text x={stepX(N) + 8} y={stateY(LSTM_FINAL) + 4} fill={colors.ACCENT} fontSize={14}>
                  {LSTM_FINAL.toFixed(2)}
                </text>
              )}
            </g>
          )}

          {/* RNN baseline trace */}
          {rnnU > 0 && (
            <g opacity={Math.min(1, rnnU * 1.4)}>
              <path d={trace(RNN_STATE, rnnU * N)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={0.9} />
              {rnnU >= 0.99 && (
                <text x={stepX(N) + 8} y={stateY(RNN_FINAL) + 4} fill={colors.NEGATIVE} fontSize={14}>
                  {RNN_FINAL.toFixed(2)}
                </text>
              )}
            </g>
          )}

          {/* final read-out comparison */}
          {readU > 0 && (
            <g opacity={readU}>
              <rect x={905} y={470} width={300} height={104} rx={12} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
              <text x={925} y={500} fill={colors.ACCENT} fontSize={15}>
                {`gated memory   ${LSTM_FINAL.toFixed(2)} — recalls`}
              </text>
              <text x={925} y={530} fill={colors.NEGATIVE} fontSize={15}>
                {`plain recurrence ${RNN_FINAL.toFixed(2)} — noise`}
              </text>
              <text x={925} y={558} fill={colors.MUTED} fontSize={13}>
                same sequence, same seventeen steps
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'c_t = f_t\\,c_{t-1} + i_t\\,\\tilde{c}_t \\qquad f_t \\approx 0.998'}
        x={985}
        y={70}
        fontSize={20}
        color={colors.WARM}
        opacity={s.get(scene.eqU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Gated Memory
          </text>
          <MathLabel
            tex={'\\text{multiplied chain} \\;\\to\\; \\text{additive belt} + \\text{learned locks}'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            after 17 noisy steps: the LSTM holds 0.95 — the plain RNN holds -0.10
          </text>
        </g>
      )}
    </>
  );
}

export function LstmGates() {
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
