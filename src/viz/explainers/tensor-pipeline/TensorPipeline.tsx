import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CELL,
  MAT_Y,
  MS,
  MW_X,
  MX_X,
  MY_X,
  M_SHOW,
  PL_CH,
  PL_CW,
  PL_X0,
  PL_Y0,
  P_STAGES,
  W,
  X,
  Y_FULL,
  bubbleFrac,
  buildScene,
} from './scene';

/**
 * Cutting the Model — pure render. The matmul values and the pipeline
 * schedules are computed in scene.ts (split asserted equal to the full
 * product).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/tensor-pipeline/overrides.json',
  slug: 'tensor-pipeline',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Mat({
  vals,
  x,
  y,
  color,
  colorFrom,
  opacity = 1,
}: {
  vals: number[][];
  x: number;
  y: number;
  color?: (j: number) => string;
  colorFrom?: number;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      {vals.map((row, i) =>
        row.map((v, j) => (
          <g key={`${i}-${j}`}>
            <rect
              x={x + j * CELL}
              y={y + i * CELL}
              width={CELL - 3}
              height={CELL - 3}
              rx={4}
              fill={color ? color(j) : colors.PANEL}
              opacity={0.85}
              stroke={colors.GRID}
            />
            <text x={x + j * CELL + (CELL - 3) / 2} y={y + i * CELL + CELL / 2 + 3} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontWeight={600}>
              {v.toFixed(1)}
            </text>
          </g>
        )),
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const matU = s.get(scene.matU);
  const splitU = s.get(scene.splitU);
  const yU = s.get(scene.yU);
  const seamU = s.get(scene.seamU);
  const pipeU = s.get(scene.pipeU);
  const mSweep = s.get(scene.mSweep);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const mIdx = Math.min(MS.length - 1, Math.round(mSweep));
  const mNow = MS[mIdx];
  const slots = mNow + P_STAGES - 1;
  const cw = Math.min(PL_CW, 900 / slots);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* --- tensor parallel matmul (whisper when pipeline takes over) --- */}
          <g opacity={Math.max(0.12, 1 - 0.9 * pipeU)}>
            {matU > 0 && (
              <g opacity={matU}>
                <Mat vals={X} x={MX_X} y={MAT_Y} />
                <text x={MX_X + 2 * CELL} y={MAT_Y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  input X (2×4)
                </text>
                <MathLabel tex={'\\times'} x={MW_X - 28} y={MAT_Y + 2 * CELL} fontSize={18} color={colors.MUTED} opacity={matU} />
                <Mat
                  vals={W}
                  x={MW_X}
                  y={MAT_Y - CELL}
                  color={(j) => (splitU > 0 ? (j < 2 ? colors.ACCENT : colors.SECONDARY) : colors.PANEL)}
                />
                <text x={MW_X + 2 * CELL} y={MAT_Y - CELL - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  weights W (4×4)
                </text>
                {splitU > 0.4 && (
                  <g opacity={splitU}>
                    <text x={MW_X + CELL} y={MAT_Y + 3 * CELL + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={12}>
                      device A
                    </text>
                    <text x={MW_X + 3 * CELL} y={MAT_Y + 3 * CELL + 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={12}>
                      device B
                    </text>
                  </g>
                )}
                <MathLabel tex={'='} x={MY_X - 26} y={MAT_Y + 2 * CELL} fontSize={18} color={colors.MUTED} opacity={matU} />
                {/* output fills cell by cell, device A cols first */}
                {Y_FULL.map((row, i) =>
                  row.map((v, j) => {
                    const order = j < 2 ? i * 2 + j : 4 + i * 2 + (j - 2);
                    const u = clamp01(yU - order);
                    if (u <= 0) return null;
                    return (
                      <g key={`${i}-${j}`} opacity={u}>
                        <rect x={MY_X + j * CELL} y={MAT_Y + i * CELL} width={CELL - 3} height={CELL - 3} rx={4} fill={j < 2 ? colors.ACCENT : colors.SECONDARY} opacity={0.85} stroke={colors.GRID} />
                        <text x={MY_X + j * CELL + (CELL - 3) / 2} y={MAT_Y + i * CELL + CELL / 2 + 3} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontWeight={620}>
                          {v.toFixed(2)}
                        </text>
                      </g>
                    );
                  }),
                )}
                {yU >= 8 && (
                  <text x={MY_X + 2 * CELL} y={MAT_Y - 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                    output = full X·W exactly
                  </text>
                )}
                {seamU > 0 && (
                  <g opacity={seamU}>
                    <line x1={MY_X + 2 * CELL - 2} y1={MAT_Y - 6} x2={MY_X + 2 * CELL - 2} y2={MAT_Y + 2 * CELL + 4} stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="5 4" />
                    <text x={MY_X + 2 * CELL} y={MAT_Y + 2 * CELL + 28} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
                      the seam: exchange halves every layer
                    </text>
                  </g>
                )}
              </g>
            )}
          </g>

          {/* --- pipeline schedule --- */}
          {pipeU > 0 && (
            <g opacity={clamp01(pipeU)}>
              {Array.from({ length: P_STAGES }, (_, st) => (
                <g key={st}>
                  <text x={PL_X0 - 16} y={PL_Y0 + st * (PL_CH + 6) + PL_CH / 2 + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                    {`stage ${st + 1}`}
                  </text>
                  {Array.from({ length: slots }, (_, t) => {
                    const busy = t >= st && t < st + mNow;
                    const u = clamp01(pipeU * (M_SHOW + P_STAGES) - t);
                    if (u <= 0) return null;
                    return (
                      <rect
                        key={t}
                        x={PL_X0 + t * (cw + 3)}
                        y={PL_Y0 + st * (PL_CH + 6)}
                        width={cw}
                        height={PL_CH}
                        rx={4}
                        fill={busy ? colors.POSITIVE : colors.NEGATIVE}
                        opacity={busy ? 0.75 : 0.3}
                      />
                    );
                  })}
                </g>
              ))}
              <text x={PL_X0} y={PL_Y0 - 18} fill={colors.MUTED} fontSize={13}>
                {`pipeline schedule · ${mNow} microbatch${mNow > 1 ? 'es' : ''} · time →`}
              </text>
              <text x={PL_X0 + slots * (cw + 3) + 18} y={PL_Y0 + 2 * (PL_CH + 6)} fill={colors.WARM} fontSize={14.5} fontWeight={650}>
                {`bubble: ${(bubbleFrac(mNow) * 100).toFixed(1)}%`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Cutting the Model
          </text>
          <MathLabel
            tex={'\\text{tensor: } XW = [XW_A \\,|\\, XW_B] \\qquad \\text{pipeline: } \\tfrac{p-1}{m+p-1}'}
            x={640}
            y={340}
            fontSize={19}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            constant chatter inside layers, or bubbles at the ends — pick your tax
          </text>
        </g>
      )}
    </>
  );
}

export function TensorPipeline() {
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
