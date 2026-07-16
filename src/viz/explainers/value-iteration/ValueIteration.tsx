import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CELL,
  COLS,
  GAMMA,
  GOAL,
  N_SWEEPS,
  PATH,
  POLICY,
  ROWS,
  START,
  buildScene,
  cellCX,
  cellCY,
  cellX,
  cellY,
  isWall,
  valuesAt,
} from './scene';

/**
 * The Value of a State — value iteration, replayed.
 * Pure render: the heatmap lerps between RECORDED Bellman sweeps computed in
 * scene.ts; policy arrows and the greedy path are derived from the true
 * converged values. Nothing here invents motion.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/value-iteration/overrides.json', slug: 'value-iteration' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const ARROW = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const goalU = s.get(scene.goalU);
  const agentU = s.get(scene.agentU);
  const sweepProg = s.get(scene.sweepProg);
  const showVals = s.get(scene.showVals);
  const arrowsU = s.get(scene.arrowsU);
  const pathProg = s.get(scene.pathProg);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const V = valuesAt(sweepProg);
  const sweepShown = Math.min(N_SWEEPS, Math.ceil(sweepProg - 1e-4));

  // path dot position — lerped along the recorded greedy path
  const pf = Math.max(0, Math.min(PATH.length - 1, pathProg));
  const pi = Math.floor(pf);
  const pt = pf - pi;
  const pa = PATH[pi];
  const pb = PATH[Math.min(PATH.length - 1, pi + 1)];
  const dotX = cellCX(pa.c) + (cellCX(pb.c) - cellCX(pa.c)) * pt;
  const dotY = cellCY(pa.r) + (cellCY(pb.r) - cellCY(pa.r)) * pt;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the grid — one persistent object; heat = the true values */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const u = clamp01(gridU * 2 - (r * COLS + c) / (ROWS * COLS));
              if (u <= 0) return null;
              const wall = isWall(c, r);
              const goal = c === GOAL.c && r === GOAL.r;
              const v = V[r][c];
              return (
                <g key={`${c},${r}`} opacity={u}>
                  <rect
                    x={cellX(c) + 3}
                    y={cellY(r) + 3}
                    width={CELL - 6}
                    height={CELL - 6}
                    rx={8}
                    fill={wall ? colors.GRID : goal ? colors.PANEL : colors.heat(v)}
                    opacity={wall ? 0.9 : goal ? 1 : 0.28 + 0.72 * v}
                    stroke={goal ? colors.WARM : colors.GRID}
                    strokeWidth={goal ? 2.5 : 1}
                  />
                  {!wall && !goal && showVals > 0 && v > 0.005 && (
                    <text
                      x={cellCX(c)}
                      y={cellCY(r) + 5}
                      textAnchor="middle"
                      fill={colors.TEXT}
                      fontSize={15}
                      opacity={showVals}
                    >
                      {v.toFixed(2)}
                    </text>
                  )}
                  {/* policy arrows */}
                  {!wall && !goal && arrowsU > 0 && POLICY[r][c] !== null && (
                    <g opacity={arrowsU * 0.9}>
                      <line
                        x1={cellCX(c) - ARROW[POLICY[r][c] as number][0] * 14}
                        y1={cellCY(r) - ARROW[POLICY[r][c] as number][1] * 14}
                        x2={cellCX(c) + ARROW[POLICY[r][c] as number][0] * 14}
                        y2={cellCY(r) + ARROW[POLICY[r][c] as number][1] * 14}
                        stroke={colors.TEXT}
                        strokeWidth={2.4}
                      />
                      <circle
                        cx={cellCX(c) + ARROW[POLICY[r][c] as number][0] * 14}
                        cy={cellCY(r) + ARROW[POLICY[r][c] as number][1] * 14}
                        r={3.4}
                        fill={colors.TEXT}
                      />
                    </g>
                  )}
                </g>
              );
            }),
          )}

          {/* the reward square */}
          <g opacity={goalU}>
            <circle cx={cellCX(GOAL.c)} cy={cellCY(GOAL.r)} r={16} fill="none" stroke={colors.WARM} strokeWidth={3} />
            <text x={cellCX(GOAL.c)} y={cellCY(GOAL.r) + 6} textAnchor="middle" fill={colors.WARM} fontSize={17}>
              +1
            </text>
          </g>

          {/* the agent's start */}
          <g opacity={agentU * (1 - clamp01(pathProg))}>
            <circle cx={cellCX(START.c)} cy={cellCY(START.r)} r={13} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={2} />
          </g>

          {/* the greedy walk — harvesting the value map */}
          {pathProg > 0 && (
            <g>
              {PATH.slice(0, pi + 1).map((p, i) => (
                <circle key={i} cx={cellCX(p.c)} cy={cellCY(p.r)} r={4.5} fill={colors.ACCENT} opacity={0.55} />
              ))}
              <circle cx={dotX} cy={dotY} r={13} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={2} />
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + sweep badge */}
      <MathLabel
        tex={"V(s) \\leftarrow \\max_a\\,[\\,r + \\gamma\\, V(s')\\,],\\quad \\gamma = " + GAMMA}
        x={168}
        y={80}
        fontSize={20}
        opacity={s.get(scene.valTexU)}
      />
      {s.get(scene.sweepBadgeU) > 0 && (
        <g opacity={s.get(scene.sweepBadgeU)}>
          <rect x={48} y={120} width={196} height={40} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={146} fill={colors.TEXT} fontSize={15}>
            {`sweep ${sweepShown} / ${N_SWEEPS}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Value of a State
          </text>
          <MathLabel tex={"V(s) = \\max_a\\,[\\,r + \\gamma\\,V(s')\\,]"} x={640} y={345} fontSize={22} color={colors.WARM} opacity={endU} />
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`${N_SWEEPS} sweeps to the fixed point — the map of values is the strategy`}
          </text>
        </g>
      )}
    </>
  );
}

export function ValueIteration() {
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
