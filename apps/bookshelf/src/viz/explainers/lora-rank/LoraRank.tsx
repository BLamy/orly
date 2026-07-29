import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  APPROX,
  APPROX_X,
  AB_X,
  CELL,
  D,
  DW,
  ERRS,
  GRID_Y,
  MAX_ABS,
  SVD,
  buildScene,
  gx,
  gy,
} from './scene';

/**
 * LoRA — pure render. Heatmaps, singular-value bars, and error readouts all
 * come from the real Jacobi SVD computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/lora-rank/overrides.json', slug: 'lora-rank' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const cellFill = (v: number): { fill: string; opacity: number } => ({
  fill: v >= 0 ? colors.ACCENT : colors.NEGATIVE,
  opacity: 0.12 + 0.88 * clamp01(Math.abs(v) / MAX_ABS),
});

function Heat({
  M,
  x0,
  y0,
  cell,
  reveal,
}: {
  M: number[][];
  x0: number;
  y0: number;
  cell: number;
  reveal: number;
}) {
  return (
    <g>
      {M.map((row, i) =>
        row.map((v, j) => {
          const u = clamp01(reveal * 1.6 - (i * D + j) / (D * D));
          if (u <= 0) return null;
          const f = cellFill(v);
          return (
            <rect
              key={`${i}-${j}`}
              x={x0 + j * cell}
              y={y0 + i * cell}
              width={cell - 1.5}
              height={cell - 1.5}
              rx={2}
              fill={f.fill}
              opacity={f.opacity * u}
            />
          );
        }),
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const svU = s.get(scene.svU);
  const rankSel = Math.round(s.get(scene.rankSel)) as 1 | 2 | 4;
  const factU = s.get(scene.factU);
  const errU = s.get(scene.errU);
  const scaleU = s.get(scene.scaleU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const approx = APPROX[rankSel] ?? APPROX[1];
  const err = ERRS[rankSel] ?? ERRS[1];
  const smax = SVD.S[0];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* ΔW heatmap */}
          <Heat M={DW} x0={gx(0)} y0={gy(0)} cell={CELL} reveal={gridU} />
          <text x={gx(0)} y={gy(0) - 14} fill={colors.TEXT} fontSize={15} opacity={gridU}>
            the fine-tuning update — all 256 numbers
          </text>
          <MathLabel tex={'\\Delta W'} x={gx(D) + 26} y={gy(0) + 14} fontSize={20} color={colors.TEXT} opacity={gridU} />

          {/* singular value bars */}
          {svU > 0 && (
            <g>
              {SVD.S.map((sv, k) => {
                const u = clamp01(svU * D - k);
                const h = (sv / smax) * 120 * u;
                return (
                  <rect
                    key={k}
                    x={gx(0) + k * 26}
                    y={gy(D) + 158 - h}
                    width={20}
                    height={Math.max(1, h)}
                    rx={3}
                    fill={k < rankSel && factU > 0 ? colors.WARM : colors.SECONDARY}
                    opacity={0.9 * u}
                  />
                );
              })}
              <line x1={gx(0)} y1={gy(D) + 158} x2={gx(0) + D * 26} y2={gy(D) + 158} stroke={colors.GRID} />
              <text x={gx(0)} y={gy(D) + 182} fill={colors.MUTED} fontSize={13} opacity={svU}>
                singular values — the directions of the update, by strength
              </text>
            </g>
          )}

          {/* B·A factors */}
          {factU > 0 && (
            <g opacity={factU}>
              {/* B: tall thin */}
              {Array.from({ length: D }, (_, i) =>
                Array.from({ length: rankSel }, (_, k) => {
                  const v = SVD.U[i][k] * Math.sqrt(SVD.S[k]);
                  const f = cellFill(v * 1.4);
                  return (
                    <rect key={`b${i}-${k}`} x={AB_X + k * 16} y={GRID_Y + i * 16} width={14} height={14} rx={2} fill={f.fill} opacity={f.opacity} />
                  );
                }),
              )}
              <text x={AB_X} y={GRID_Y - 12} fill={colors.WARM} fontSize={14}>
                B
              </text>
              {/* A: short wide */}
              {Array.from({ length: rankSel }, (_, k) =>
                Array.from({ length: D }, (_, j) => {
                  const v = SVD.V[j][k] * Math.sqrt(SVD.S[k]);
                  const f = cellFill(v * 1.4);
                  return (
                    <rect key={`a${k}-${j}`} x={AB_X - 8 + j * 10} y={GRID_Y + D * 16 + 26 + k * 10} width={8.5} height={8.5} rx={1.5} fill={f.fill} opacity={f.opacity} />
                  );
                }),
              )}
              <text x={AB_X - 30} y={GRID_Y + D * 16 + 36} fill={colors.WARM} fontSize={14}>
                A
              </text>

              {/* reconstruction */}
              <Heat M={approx} x0={APPROX_X} y0={GRID_Y} cell={18} reveal={1} />
              <text x={APPROX_X} y={GRID_Y - 12} fill={colors.TEXT} fontSize={14}>
                {`B · A — rank ${rankSel}`}
              </text>
              {errU > 0 && (
                <g opacity={errU}>
                  <rect x={APPROX_X} y={GRID_Y + D * 18 + 18} width={D * 18} height={64} rx={10} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
                  <text x={APPROX_X + 14} y={GRID_Y + D * 18 + 44} fill={colors.TEXT} fontSize={15}>
                    {`missed: ${(err * 100).toFixed(1)}% of the update`}
                  </text>
                  <text x={APPROX_X + 14} y={GRID_Y + D * 18 + 68} fill={colors.MUTED} fontSize={13.5}>
                    {`stored: ${2 * D * rankSel} numbers vs ${D * D}`}
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'\\Delta W \\approx B\\,A \\qquad W_{\\text{new}} = W + B\\,A'}
        x={985}
        y={64}
        fontSize={20}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* the at-scale payoff */}
      {scaleU > 0 && (
        <g opacity={scaleU * dimU}>
          <rect x={70} y={560} width={640} height={54} rx={12} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={92} y={594} fill={colors.TEXT} fontSize={16}>
            d = 4096, r = 8: 65,536 trained numbers instead of 16,777,216 — 0.4%
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Low-Rank Adaptation
          </text>
          <MathLabel
            tex={'W_{\\text{new}} = W + B\\,A, \\quad r \\ll d'}
            x={640}
            y={340}
            fontSize={22}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the task's change lives in a thin slice of weight space — learn only the nudge
          </text>
        </g>
      )}
    </>
  );
}

export function LoraRank() {
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
