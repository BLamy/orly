import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  FINAL,
  HIST,
  M,
  ORDER,
  ROUNDS,
  STUCK,
  accAt,
  buildScene,
  cellPos,
  chX,
  chY,
  pAt,
} from './scene';

/**
 * Curriculum and Bootstrapping — pure render. Grid heat and the accuracy
 * curve sample the real 6-round STaR run from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/star-bootstrap/overrides.json', slug: 'star-bootstrap' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function accPath(upTo: number): string {
  const n = Math.max(2, Math.min(ROUNDS + 1, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i++) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(HIST[i].acc).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gridU = s.get(scene.gridU);
  const round = s.get(scene.round);
  const axU = s.get(scene.axU);
  const stuckU = s.get(scene.stuckU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const acc = accAt(round);
  const roundIdx = Math.round(Math.min(ROUNDS, round));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the problem grid */}
          {ORDER.map((idx, k) => {
            const u = clamp01(gridU * 1.6 - k / M);
            if (u <= 0) return null;
            const p = pAt(round, idx);
            const stuck = FINAL.p[idx] < 0.05;
            const pos = cellPos(k);
            return (
              <rect
                key={idx}
                x={pos.x}
                y={pos.y}
                width={20}
                height={20}
                rx={4}
                fill={colors.heat(p)}
                opacity={u * (stuck && stuckU > 0 ? 1 : 0.85)}
                stroke={stuck && stuckU > 0 ? colors.NEGATIVE : 'none'}
                strokeWidth={1.6}
              />
            );
          })}
          {gridU > 0.5 && (
            <g opacity={gridU * Math.max(0, 1 - 1.4 * axU)}>
              <text x={cellPos(0).x} y={cellPos(0).y - 24} fill={colors.MUTED} fontSize={13}>
                {`300 problems · heat = chance one attempt succeeds · round ${roundIdx}`}
              </text>
              <text x={cellPos(0).x} y={cellPos(M - 1).y + 48} fill={colors.MUTED} fontSize={12.5}>
                {`accuracy: ${(acc * 100).toFixed(1)}%${roundIdx > 0 ? ` · kept last round: ${(HIST[Math.max(1, roundIdx)].keptFrac * 100).toFixed(0)}%` : ''}`}
              </text>
            </g>
          )}
          {stuckU > 0 && (
            <text x={cellPos(0).x} y={cellPos(M - 1).y + 74} fill={colors.NEGATIVE} fontSize={12.5} opacity={stuckU}>
              {`outlined: ${STUCK} problems that never yielded a verified chain`}
            </text>
          )}

          {/* accuracy curve */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(ROUNDS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.02)} stroke={colors.GRID} />
              {Array.from({ length: ROUNDS + 1 }, (_, r) => (
                <text key={r} x={chX(r)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {r}
                </text>
              ))}
              <text x={chX(ROUNDS / 2)} y={CH_Y0 + 44} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                bootstrap round →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                1.0
              </text>
            </g>
          )}
          {axU > 0 && round > 0 && (
            <g>
              <path d={accPath(round)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} opacity={axU} />
              <circle cx={chX(Math.min(round, ROUNDS))} cy={chY(acc)} r={5} fill={colors.POSITIVE} opacity={axU} />
              <text x={chX(Math.min(round, ROUNDS)) - 8} y={chY(acc) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13.5} opacity={axU}>
                {`${(acc * 100).toFixed(1)}%`}
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
            Curriculum and Bootstrapping
          </text>
          <MathLabel
            tex={`\\text{keep only verified} \\Rightarrow 36.6\\% \\to ${(FINAL.acc * 100).toFixed(1)}\\% \\quad (${STUCK}\\ \\text{never move})`}
            x={640}
            y={340}
            fontSize={19}
            color={colors.POSITIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            collapse becomes curriculum when a check stands at the gate
          </text>
        </g>
      )}
    </>
  );
}

export function StarBootstrap() {
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
