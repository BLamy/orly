import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ALPHA,
  CELL,
  COLS,
  EP1,
  EP1_LEN,
  FINAL_PATH,
  FINAL_Q_MAX,
  GAMMA,
  GOAL,
  LENGTHS,
  N_EPISODES,
  ROWS,
  START,
  buildScene,
  cellCX,
  cellCY,
  cellX,
  cellY,
  chartX,
  chartY,
  isWall,
  maxQAt,
} from './scene';

/**
 * Q-Learning — learning from the next step.
 * Pure render: the wandering first episode, the max-Q heat, the episode-length
 * learning curve, and the final greedy path all replay the RECORDED tabular
 * Q-learning run computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/q-learning/overrides.json', slug: 'q-learning' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const goalU = s.get(scene.goalU);
  const ep1Prog = s.get(scene.ep1Prog);
  const flashU = s.get(scene.flashU);
  const epProg = s.get(scene.epProg);
  const chartU = s.get(scene.chartU);
  const pathProg = s.get(scene.pathProg);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // during the slow episode-1 walk the heat comes from the FIRST snapshot
  // being built live; afterwards epProg drives the recorded snapshots.
  const V = maxQAt(epProg);
  const epShown = Math.min(N_EPISODES, Math.max(1, Math.ceil(epProg - 1e-4)));

  // episode-1 agent position, lerped along the recorded transitions
  const ef = Math.max(0, Math.min(EP1_LEN, ep1Prog));
  const ei = Math.min(EP1_LEN - 1, Math.floor(ef));
  const et = ef - ei;
  const tr = EP1[ei];
  const agentActive = ep1Prog > 0 && ep1Prog < EP1_LEN + 0.5 && epProg < 0.5;
  const ax = cellCX(tr.c) + (cellCX(tr.nc) - cellCX(tr.c)) * et;
  const ay = cellCY(tr.r) + (cellCY(tr.nr) - cellCY(tr.r)) * et;
  // the one cell episode 1 actually lit up (the transition into the goal)
  const lastTr = EP1[EP1_LEN - 1];
  const ep1Lit = ep1Prog >= EP1_LEN - 0.2;

  // final greedy path dot
  const pf = Math.max(0, Math.min(FINAL_PATH.length - 1, pathProg));
  const pi = Math.floor(pf);
  const pt = pf - pi;
  const pa = FINAL_PATH[pi];
  const pb = FINAL_PATH[Math.min(FINAL_PATH.length - 1, pi + 1)];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the grid, heat = recorded max-Q */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const u = clamp01(gridU * 2 - (r * COLS + c) / (ROWS * COLS));
              if (u <= 0) return null;
              const wall = isWall(c, r);
              const goal = c === GOAL.c && r === GOAL.r;
              let v = V[r][c] / (FINAL_Q_MAX || 1);
              // episode one's single lit square, before epProg takes over
              if (epProg < 0.5 && ep1Lit && c === lastTr.c && r === lastTr.r) {
                v = Math.max(v, lastTr.qAfter / (FINAL_Q_MAX || 1));
              } else if (epProg < 0.5) {
                v = c === lastTr.c && r === lastTr.r && ep1Lit ? v : 0;
              }
              return (
                <rect
                  key={`${c},${r}`}
                  x={cellX(c) + 3}
                  y={cellY(r) + 3}
                  width={CELL - 6}
                  height={CELL - 6}
                  rx={8}
                  fill={wall ? colors.GRID : goal ? colors.PANEL : colors.heat(clamp01(v))}
                  opacity={u * (wall ? 0.9 : goal ? 1 : 0.28 + 0.72 * clamp01(v))}
                  stroke={goal ? colors.WARM : colors.GRID}
                  strokeWidth={goal ? 2.5 : 1}
                />
              );
            }),
          )}

          {/* the reward square */}
          <g opacity={goalU}>
            <circle cx={cellCX(GOAL.c)} cy={cellCY(GOAL.r)} r={15} fill="none" stroke={colors.WARM} strokeWidth={3} />
            <text x={cellCX(GOAL.c)} y={cellCY(GOAL.r) + 6} textAnchor="middle" fill={colors.WARM} fontSize={16}>
              +1
            </text>
          </g>

          {/* episode-1 wander: breadcrumb + agent */}
          {agentActive && (
            <g>
              {EP1.slice(0, ei + 1).map((t2, i) => (
                <circle key={i} cx={cellCX(t2.c)} cy={cellCY(t2.r)} r={3.5} fill={colors.SECONDARY} opacity={0.4} />
              ))}
              <circle cx={ax} cy={ay} r={12} fill={colors.SECONDARY} stroke={colors.BG} strokeWidth={2} />
            </g>
          )}

          {/* the single TD flash when episode 1 finds the reward */}
          {flashU > 0 && (
            <g opacity={flashU}>
              <rect
                x={cellX(lastTr.c) + 3}
                y={cellY(lastTr.r) + 3}
                width={CELL - 6}
                height={CELL - 6}
                rx={8}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={3.5}
              />
              <text x={cellCX(lastTr.c)} y={cellY(lastTr.r) - 8} textAnchor="middle" fill={colors.POSITIVE} fontSize={15}>
                {`Q: 0 → ${lastTr.qAfter.toFixed(2)}`}
              </text>
            </g>
          )}

          {/* the final greedy walk */}
          {pathProg > 0 && (
            <g>
              {FINAL_PATH.slice(0, pi + 1).map((p, i) => (
                <circle key={i} cx={cellCX(p.c)} cy={cellCY(p.r)} r={4.5} fill={colors.ACCENT} opacity={0.55} />
              ))}
              <circle
                cx={cellCX(pa.c) + (cellCX(pb.c) - cellCX(pa.c)) * pt}
                cy={cellCY(pa.r) + (cellCY(pb.r) - cellCY(pa.r)) * pt}
                r={12}
                fill={colors.ACCENT}
                stroke={colors.BG}
                strokeWidth={2}
              />
            </g>
          )}

          {/* start marker */}
          <circle cx={cellCX(START.c)} cy={cellCY(START.r)} r={5} fill={colors.MUTED} opacity={gridU * 0.8} />

          {/* the learning curve — episode length per episode */}
          {chartU > 0 && (
            <g opacity={chartU}>
              <line x1={chartX(0)} y1={chartY(0)} x2={chartX(N_EPISODES)} y2={chartY(0)} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={chartX(0)} y1={chartY(0)} x2={chartX(0)} y2={chartY(100)} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={chartX(N_EPISODES / 2)} y={chartY(0) + 30} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                episode
              </text>
              <text x={chartX(0) - 14} y={chartY(100) - 12} fill={colors.MUTED} fontSize={14}>
                steps to reward
              </text>
              {LENGTHS.map((len, e) =>
                e < epProg ? (
                  <circle key={e} cx={chartX(e)} cy={chartY(len)} r={3} fill={colors.ACCENT} opacity={0.75} />
                ) : null,
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + episode badge */}
      <MathLabel
        tex={"Q(s,a) \\mathrel{+}= \\alpha\\,[\\,r + \\gamma \\max_{a'} Q(s',a') - Q(s,a)\\,]"}
        x={880}
        y={70}
        fontSize={19}
        opacity={s.get(scene.tdTexU)}
      />
      {badgeU > 0 && (
        <g opacity={badgeU}>
          <rect x={48} y={584} width={230} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {epProg < 0.5 ? `episode 1 · step ${Math.min(EP1_LEN, Math.floor(ep1Prog) + 1)}` : `episode ${epShown} / ${N_EPISODES}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Q-Learning
          </text>
          <MathLabel
            tex={"Q(s,a) \\mathrel{+}= \\alpha\\,[\\,r + \\gamma \\max_{a'} Q(s',a') - Q(s,a)\\,]"}
            x={640}
            y={345}
            fontSize={20}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`${N_EPISODES} episodes, α = ${ALPHA}, γ = ${GAMMA} — the map was never given, only bumped into`}
          </text>
        </g>
      )}
    </>
  );
}

export function QLearning() {
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
