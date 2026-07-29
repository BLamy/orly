import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CELL,
  COINS,
  COLS,
  GAMMA,
  INTENDED_PATH,
  OPT_PATH,
  OPT_SCORE,
  ROWS,
  START,
  TROPHY,
  V,
  V_MAX,
  buildScene,
  cellCX,
  cellCY,
  cellX,
  cellY,
} from './scene';

/**
 * Reward Hacking — the letter, not the spirit.
 * Pure render: the value heat, the optimal walk, and the climbing score all
 * come from the EXACT value-iteration solution of the misspecified MDP in
 * scene.ts. The agent circling the coins is provably optimal, not staged.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/reward-hacking/overrides.json', slug: 'reward-hacking' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function pathD(cells: { c: number; r: number }[], upTo: number): string {
  const n = Math.max(1, Math.min(cells.length, upTo));
  return cells
    .slice(0, n)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${cellCX(p.c).toFixed(1)} ${cellCY(p.r).toFixed(1)}`)
    .join('');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const trophyU = s.get(scene.trophyU);
  const coinsU = s.get(scene.coinsU);
  const intentU = s.get(scene.intentU);
  const heatU = s.get(scene.heatU);
  const showVals = s.get(scene.showVals);
  const pathProg = s.get(scene.pathProg);
  const scoreU = s.get(scene.scoreU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const pf = Math.max(0, Math.min(OPT_PATH.length - 1, pathProg));
  const pi = Math.floor(pf);
  const pt = pf - pi;
  const pa = OPT_PATH[pi];
  const pb = OPT_PATH[Math.min(OPT_PATH.length - 1, pi + 1)];
  const score = OPT_SCORE[pi] + (OPT_SCORE[Math.min(OPT_SCORE.length - 1, pi + 1)] - OPT_SCORE[pi]) * pt;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the grid — heat is the TRUE optimal value function */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const u = clamp01(gridU * 2 - (r * COLS + c) / (ROWS * COLS));
              if (u <= 0) return null;
              const trophy = c === TROPHY.c && r === TROPHY.r;
              const v = (V[r][c] / V_MAX) * heatU;
              return (
                <g key={`${c},${r}`} opacity={u}>
                  <rect
                    x={cellX(c) + 3}
                    y={cellY(r) + 3}
                    width={CELL - 6}
                    height={CELL - 6}
                    rx={8}
                    fill={trophy ? colors.PANEL : heatU > 0 ? colors.heat(clamp01(v)) : colors.BG}
                    opacity={trophy ? 1 : heatU > 0 ? 0.28 + 0.72 * clamp01(v) : 1}
                    stroke={trophy ? colors.WARM : colors.GRID}
                    strokeWidth={trophy ? 2.5 : 1}
                  />
                  {!trophy && showVals > 0 && (
                    <text x={cellCX(c)} y={cellCY(r) + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={showVals}>
                      {V[r][c].toFixed(1)}
                    </text>
                  )}
                </g>
              );
            }),
          )}

          {/* the trophy */}
          <g opacity={trophyU}>
            <text x={cellCX(TROPHY.c)} y={cellCY(TROPHY.r) - 4} textAnchor="middle" fontSize={30}>
              🏆
            </text>
            <text x={cellCX(TROPHY.c)} y={cellCY(TROPHY.r) + 28} textAnchor="middle" fill={colors.WARM} fontSize={15}>
              +10, ends
            </text>
          </g>

          {/* the coins */}
          {COINS.map((p, i) => (
            <g key={i} opacity={coinsU}>
              <circle cx={cellCX(p.c)} cy={cellCY(p.r) - 6} r={15} fill="none" stroke={colors.WARM} strokeWidth={3} />
              <text x={cellCX(p.c)} y={cellCY(p.r) - 1} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                +1
              </text>
              <text x={cellCX(p.c)} y={cellCY(p.r) + 32} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                every visit
              </text>
            </g>
          ))}

          {/* start marker */}
          <text x={cellCX(START.c)} y={cellY(START.r) + CELL - 12} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={gridU}>
            start
          </text>

          {/* the designer's intended path (dashed, hopeful) */}
          {intentU > 0 && (
            <path
              d={pathD(INTENDED_PATH, Math.ceil(intentU * INTENDED_PATH.length))}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={3}
              strokeDasharray="8 7"
              opacity={0.8 * intentU}
            />
          )}

          {/* the truly optimal walk */}
          {pathProg > 0 && (
            <g>
              <path d={pathD(OPT_PATH, pi + 1)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={0.5} />
              <circle
                cx={cellCX(pa.c) + (cellCX(pb.c) - cellCX(pa.c)) * pt}
                cy={cellCY(pa.r) + (cellCY(pb.r) - cellCY(pa.r)) * pt}
                r={13}
                fill={colors.NEGATIVE}
                stroke={colors.BG}
                strokeWidth={2}
              />
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed: the exploit math + the score counter */}
      <MathLabel
        tex={'1 + \\gamma + \\gamma^2 + \\cdots = \\tfrac{1}{1-\\gamma} = 20 \\;\\; > \\;\\; 10\\,\\gamma^5 \\approx 7.7'}
        x={1010}
        y={66}
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />
      {scoreU > 0 && (
        <g opacity={scoreU}>
          <rect x={48} y={584} width={280} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`score ${score.toFixed(0)} — trophies reached: 0`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={232} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Reward Hacking
          </text>
          <MathLabel
            tex={'\\text{optimize the letter} \\;\\ne\\; \\text{honor the spirit}'}
            x={640}
            y={338}
            fontSize={21}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`γ = ${GAMMA}: the coin loop is worth 20, the trophy 7.7 — the exploit is the optimal policy`}
          </text>
        </g>
      )}
    </>
  );
}

export function RewardHacking() {
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
