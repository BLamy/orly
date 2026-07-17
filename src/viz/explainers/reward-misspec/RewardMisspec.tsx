import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  AS_WRITTEN,
  CELL,
  COLS,
  GOAL,
  GRID_X,
  GRID_Y,
  OTHER_VASES,
  PATCHED,
  ROWS,
  START,
  VASE,
  V_MAX,
  buildScene,
  cellCX,
  cellCY,
} from './scene';
import type { Cell } from './scene';

/**
 * Reward Misspecification — pure render. Both walks and the value heat are
 * the exact value-iteration solutions from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/reward-misspec/overrides.json', slug: 'reward-misspec' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function walker(path: Cell[], prog: number): { x: number; y: number } {
  const f = Math.max(0, Math.min(path.length - 1, prog));
  const i = Math.floor(f);
  const t = f - i;
  const a = path[i];
  const b = path[Math.min(path.length - 1, i + 1)];
  return {
    x: cellCX(a.c) + (cellCX(b.c) - cellCX(a.c)) * t,
    y: cellCY(a.r) + (cellCY(b.r) - cellCY(a.r)) * t,
  };
}

function pathD(path: Cell[], upTo: number): string {
  const n = Math.max(1, Math.min(path.length, Math.ceil(upTo) + 1));
  return path
    .slice(0, n)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${cellCX(p.c)} ${cellCY(p.r)}`)
    .join('');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const vaseU = s.get(scene.vaseU);
  const heatU = s.get(scene.heatU);
  const walk1 = s.get(scene.walk1);
  const crashU = s.get(scene.crashU);
  const penU = s.get(scene.penU);
  const walk2 = s.get(scene.walk2);
  const otherU = s.get(scene.otherU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const w1 = walker(AS_WRITTEN.path, walk1);
  const w2 = walker(PATCHED.path, walk2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* grid + heat */}
          {Array.from({ length: ROWS }, (_, r) =>
            Array.from({ length: COLS }, (_, c) => {
              const u = clamp01(gridU * 2 - (r * COLS + c) / (ROWS * COLS));
              if (u <= 0) return null;
              const goal = c === GOAL.c && r === GOAL.r;
              const v = clamp01((AS_WRITTEN.V[r][c] / V_MAX) * heatU);
              return (
                <rect
                  key={`${c},${r}`}
                  x={GRID_X + c * CELL + 3}
                  y={GRID_Y + r * CELL + 3}
                  width={CELL - 6}
                  height={CELL - 6}
                  rx={8}
                  fill={goal ? colors.PANEL : heatU > 0 ? colors.heat(v) : colors.BG}
                  opacity={u * (goal ? 1 : heatU > 0 ? 0.26 + 0.74 * v : 1)}
                  stroke={goal ? colors.WARM : colors.GRID}
                  strokeWidth={goal ? 2.5 : 1}
                />
              );
            }),
          )}
          {/* labels */}
          <text x={cellCX(START.c)} y={cellCY(START.r) + 40} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={gridU}>
            start
          </text>
          <g opacity={gridU}>
            <text x={cellCX(GOAL.c)} y={cellCY(GOAL.r) + 8} textAnchor="middle" fontSize={26}>
              🏁
            </text>
            <text x={cellCX(GOAL.c)} y={cellCY(GOAL.r) + 36} textAnchor="middle" fill={colors.WARM} fontSize={13}>
              +10
            </text>
          </g>

          {/* the vase */}
          <g opacity={vaseU}>
            <text x={cellCX(VASE.c)} y={cellCY(VASE.r) + 10} textAnchor="middle" fontSize={30} opacity={1 - crashU}>
              🏺
            </text>
            {crashU > 0 && (
              <text x={cellCX(VASE.c)} y={cellCY(VASE.r) + 10} textAnchor="middle" fontSize={30} opacity={crashU}>
                💥
              </text>
            )}
            {penU > 0 && (
              <text x={cellCX(VASE.c)} y={cellCY(VASE.r) + 38} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={penU}>
                −3
              </text>
            )}
          </g>

          {/* other vases */}
          {otherU > 0 &&
            OTHER_VASES.map((v, i) => (
              <text
                key={i}
                x={cellCX(v.c)}
                y={cellCY(v.r) + 10}
                textAnchor="middle"
                fontSize={24}
                opacity={otherU * clamp01(otherU * 6 - i) * 0.9}
              >
                🏺
              </text>
            ))}

          {/* as-written walk */}
          {walk1 > 0 && (
            <g>
              <path d={pathD(AS_WRITTEN.path, walk1)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} opacity={0.7} />
              <circle cx={w1.x} cy={w1.y} r={13} fill={colors.NEGATIVE} stroke={colors.BG} strokeWidth={2} />
            </g>
          )}
          {/* patched walk */}
          {walk2 > 0 && (
            <g>
              <path d={pathD(PATCHED.path, walk2)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={0.8} />
              <circle cx={w2.x} cy={w2.y} r={13} fill={colors.POSITIVE} stroke={colors.BG} strokeWidth={2} />
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={penU > 0.5 ? 'r = -0.1 + 10\\,[\\text{goal}] - 3\\,[\\text{vase}]' : 'r = -0.1 + 10\\,[\\text{goal}]'}
        x={985}
        y={64}
        fontSize={19}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Reward Misspecification
          </text>
          <MathLabel
            tex={'\\text{indifference} + \\text{optimization} = \\text{a broken vase}'}
            x={640}
            y={340}
            fontSize={21}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            every reward is a partial description — pressure flows into what was left out
          </text>
        </g>
      )}
    </>
  );
}

export function RewardMisspec() {
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
