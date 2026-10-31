import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CAM_GRID,
  CAM_TROPHY,
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
const INK = '#0d1321';
const SERIF = 'Georgia, "Times New Roman", STIXGeneral, serif';

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
  const onHeat = heatU > 0.6;

  const pf = Math.max(0, Math.min(OPT_PATH.length - 1, pathProg));
  const pi = Math.floor(pf);
  const pt = pf - pi;
  const pa = OPT_PATH[pi];
  const pb = OPT_PATH[Math.min(OPT_PATH.length - 1, pi + 1)];
  const score = OPT_SCORE[pi] + (OPT_SCORE[Math.min(OPT_SCORE.length - 1, pi + 1)] - OPT_SCORE[pi]) * pt;

  // The trophy beat: the agent stands one step from the trophy. Its marker
  // fades in only as the camera arrives at the trophy framing (no timing added).
  const atTrophy =
    clamp01((cam.k - CAM_GRID.k) / (CAM_TROPHY.k - CAM_GRID.k)) *
    clamp01((cam.x - CAM_GRID.x) / (CAM_TROPHY.x - CAM_GRID.x));
  const beside = { c: TROPHY.c - 1, r: TROPHY.r };
  const armY = cellCY(beside.r);

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
              const hot = clamp01(v) > 0.6;
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
                    <text
                      x={cellCX(c)}
                      y={cellY(r) + 80}
                      textAnchor="middle"
                      fill={hot ? INK : colors.TEXT}
                      fontSize={14}
                      fontWeight={600}
                      opacity={showVals * (1 - endU)}
                    >
                      {V[r][c].toFixed(1)}
                    </text>
                  )}
                </g>
              );
            }),
          )}

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
                r={9}
                fill={colors.NEGATIVE}
                stroke={colors.BG}
                strokeWidth={2}
              />
            </g>
          )}

          {/* the agent one step from the trophy turns back toward the coins */}
          {atTrophy > 0 && (
            <g opacity={atTrophy}>
              <line
                x1={cellCX(beside.c) - 12}
                y1={armY}
                x2={cellCX(beside.c - 1) + 16}
                y2={armY}
                stroke={colors.NEGATIVE}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <path
                d={`M${cellCX(beside.c - 1) + 6} ${armY} l10 -6 v12 z`}
                fill={colors.NEGATIVE}
              />
              <circle cx={cellCX(beside.c)} cy={armY} r={10} fill={colors.NEGATIVE} stroke={colors.BG} strokeWidth={2} />
            </g>
          )}

          {/* the coins: marker sits above the path line, value below it */}
          {COINS.map((p, i) => (
            <g key={i} opacity={coinsU}>
              <circle cx={cellCX(p.c)} cy={cellY(p.r) + 20} r={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
              <text x={cellCX(p.c)} y={cellY(p.r) + 25} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={600}>
                +1
              </text>
              <text x={cellCX(p.c)} y={cellY(p.r) + 40} textAnchor="middle" fill={onHeat ? INK : colors.TEXT} fontSize={14}>
                every visit
              </text>
            </g>
          ))}

          {/* start marker */}
          <text x={cellCX(START.c)} y={cellY(START.r) + 98} textAnchor="middle" fill={onHeat ? INK : colors.TEXT} fontSize={14} opacity={gridU}>
            start
          </text>

          {/* the trophy — drawn last so the dashed path never crosses it */}
          <g opacity={trophyU}>
            <text x={cellCX(TROPHY.c)} y={cellCY(TROPHY.r) - 4} textAnchor="middle" fontSize={30}>
              🏆
            </text>
            <text x={cellCX(TROPHY.c)} y={cellCY(TROPHY.r) + 32} textAnchor="middle" fill={colors.WARM} fontSize={15}>
              +10, ends
            </text>
          </g>
        </g>
      </Camera>

      {/* screen-fixed: the exploit math + the score counter */}
      {/* the title strip behind the exploit math keeps it legible over the grid */}
      <rect x={0} y={0} width={STAGE_W} height={56} fill={colors.BG} opacity={clamp01(s.get(scene.mathU))} />
      <MathLabel
        tex={'1 + \\gamma + \\gamma^2 + \\cdots = \\tfrac{1}{1-\\gamma} = 20 \\;\\; > \\;\\; 10\\,\\gamma^5 \\approx 7.7'}
        x={640}
        y={30}
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />
      {scoreU > 0 && (
        <g opacity={scoreU}>
          <rect x={1072} y={300} width={168} height={58} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={1088} y={324} fill={colors.TEXT} fontSize={18} fontWeight={650}>
            {`score ${score.toFixed(0)}`}
          </text>
          <text x={1088} y={346} fill={colors.MUTED} fontSize={14}>
            trophies reached: 0
          </text>
        </g>
      )}

      {/* clean ending card: solid panel over the faded grid */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={232} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Reward Hacking
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.NEGATIVE} fontSize={24} fontFamily={SERIF}>
            optimize the letter ≠ honor the spirit
          </text>
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
