import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BARS_X,
  BARS_Y,
  BAR_H_MAX,
  BAR_W,
  BATCH,
  CELL,
  FINAL_START_P,
  GOAL,
  ITERS,
  MOVES,
  N,
  START,
  SUCC,
  TRAJS,
  TRAJ_ITER_LIST,
  buildScene,
  cellCX,
  cellCY,
  cellX,
  cellY,
  chartX,
  chartY,
  policyAt,
  stateIdx,
} from './scene';

/**
 * Policy Gradients — nudging what worked.
 * Pure render: policy arrows, start-state probability bars, sampled episode
 * batches, and the success curve all replay the RECORDED REINFORCE run
 * computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/policy-gradient/overrides.json', slug: 'policy-gradient' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const ACTION_LABELS = ['up', 'right', 'down', 'left'];
const ACTION_COLORS = [colors.ACCENT, colors.WARM, colors.SECONDARY, colors.TEAL];

function trajPath(cells: { c: number; r: number }[]): string {
  return cells
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${cellCX(p.c).toFixed(1)} ${cellCY(p.r).toFixed(1)}`)
    .join('');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const goalU = s.get(scene.goalU);
  const arrowsU = s.get(scene.arrowsU);
  const trajU = s.get(scene.trajU);
  const trajSet = Math.round(s.get(scene.trajSet));
  const iterProg = s.get(scene.iterProg);
  const barsU = s.get(scene.barsU);
  const chartU = s.get(scene.chartU);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const P = policyAt(iterProg);
  const startP = P[stateIdx(START.c, START.r)];
  const iterShown = Math.min(ITERS, Math.max(0, Math.round(iterProg)));
  const trajs = TRAJS[TRAJ_ITER_LIST[Math.max(0, Math.min(TRAJ_ITER_LIST.length - 1, trajSet))]];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the grid */}
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const u = clamp01(gridU * 2 - (r * N + c) / (N * N));
              if (u <= 0) return null;
              const goal = c === GOAL.c && r === GOAL.r;
              return (
                <rect
                  key={`${c},${r}`}
                  x={cellX(c) + 3}
                  y={cellY(r) + 3}
                  width={CELL - 6}
                  height={CELL - 6}
                  rx={8}
                  fill={goal ? colors.PANEL : colors.BG}
                  opacity={u}
                  stroke={goal ? colors.WARM : colors.GRID}
                  strokeWidth={goal ? 2.5 : 1}
                />
              );
            }),
          )}

          {/* the policy: four whiskers per cell, length = true probability */}
          {arrowsU > 0 &&
            Array.from({ length: N }, (_, r) =>
              Array.from({ length: N }, (_, c) => {
                if (c === GOAL.c && r === GOAL.r) return null;
                const p = P[stateIdx(c, r)];
                return (
                  <g key={`${c},${r}`} opacity={arrowsU}>
                    {MOVES.map((m, a) => {
                      const len = 6 + p[a] * 38;
                      return (
                        <line
                          key={a}
                          x1={cellCX(c)}
                          y1={cellCY(r)}
                          x2={cellCX(c) + m.dc * len}
                          y2={cellCY(r) + m.dr * len}
                          stroke={ACTION_COLORS[a]}
                          strokeWidth={1.5 + p[a] * 5}
                          strokeLinecap="round"
                          opacity={0.35 + p[a] * 0.65}
                        />
                      );
                    })}
                    <circle cx={cellCX(c)} cy={cellCY(r)} r={3} fill={colors.MUTED} opacity={0.7} />
                  </g>
                );
              }),
            )}

          {/* goal + start markers */}
          <g opacity={goalU}>
            <circle cx={cellCX(GOAL.c)} cy={cellCY(GOAL.r)} r={15} fill="none" stroke={colors.WARM} strokeWidth={3} />
            <text x={cellCX(GOAL.c)} y={cellCY(GOAL.r) + 6} textAnchor="middle" fill={colors.WARM} fontSize={16}>
              +1
            </text>
          </g>
          <text x={cellCX(START.c)} y={cellY(START.r) + CELL - 10} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={gridU}>
            start
          </text>

          {/* a sampled batch of real episodes */}
          {trajU > 0 &&
            trajs.map((t, i) => (
              <path
                key={i}
                d={trajPath(t.cells)}
                fill="none"
                stroke={t.win ? colors.POSITIVE : colors.MUTED}
                strokeWidth={t.win ? 2.6 : 1.4}
                opacity={trajU * (t.win ? 0.85 : 0.3)}
              />
            ))}

          {/* start-state probability bars */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={BARS_X + (4 * (BAR_W + 26)) / 2 - 13} y={BARS_Y - 36} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                policy at the start square
              </text>
              {startP.map((p, a) => {
                const x = BARS_X + a * (BAR_W + 26);
                const h = BAR_H_MAX * p;
                return (
                  <g key={a}>
                    <rect x={x} y={BARS_Y + BAR_H_MAX - h} width={BAR_W} height={h} rx={6} fill={ACTION_COLORS[a]} opacity={0.85} />
                    <text x={x + BAR_W / 2} y={BARS_Y + BAR_H_MAX - h - 8} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                      {(p * 100).toFixed(0)}%
                    </text>
                    <text x={x + BAR_W / 2} y={BARS_Y + BAR_H_MAX + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      {ACTION_LABELS[a]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* success-per-batch curve */}
          {chartU > 0 && (
            <g opacity={chartU}>
              <line x1={chartX(0)} y1={chartY(0)} x2={chartX(ITERS)} y2={chartY(0)} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={chartX(0)} y1={chartY(0)} x2={chartX(0)} y2={chartY(1)} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={chartX(ITERS / 2)} y={chartY(0) + 28} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                iteration
              </text>
              <text x={chartX(0)} y={chartY(1) - 10} fill={colors.MUTED} fontSize={14}>
                wins per batch of {BATCH}
              </text>
              {SUCC.map((v, e) =>
                e < iterProg ? <circle key={e} cx={chartX(e)} cy={chartY(v)} r={3} fill={colors.POSITIVE} opacity={0.8} /> : null,
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + iteration badge */}
      <MathLabel
        tex={'\\theta \\mathrel{+}= \\alpha\\, R\\, \\nabla_\\theta \\log \\pi_\\theta(a\\mid s)'}
        x={1000}
        y={64}
        fontSize={20}
        opacity={s.get(scene.texU)}
      />
      {badgeU > 0 && (
        <g opacity={badgeU}>
          <rect x={48} y={584} width={220} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`iteration ${iterShown} / ${ITERS}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Policy Gradients
          </text>
          <MathLabel
            tex={'\\theta \\mathrel{+}= \\alpha\\, R\\, \\nabla_\\theta \\log \\pi_\\theta(a\\mid s)'}
            x={640}
            y={345}
            fontSize={21}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`start square after ${ITERS} iterations: ${(Math.max(...FINAL_START_P) * 100).toFixed(0)}% on one action — it learned what paid, never why`}
          </text>
        </g>
      )}
    </>
  );
}

export function PolicyGradient() {
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
