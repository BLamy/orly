import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BEST,
  CH_X0,
  CH_Y0,
  D,
  GREEDY,
  SHOW_LEVELS,
  SWEEP,
  buildScene,
  chX,
  chY,
  lvlX,
  nodeY,
} from './scene';

/**
 * Search Over Reasoning — pure render. The tree is the real seed-301 run
 * (greedy dies at the first fork, beam-4 recovers); the sweep is 4000 trees
 * per width.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/reasoning-search/overrides.json',
  slug: 'reasoning-search',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const treeU = s.get(scene.treeU);
  const greedyU = s.get(scene.greedyU);
  const beamU = s.get(scene.beamU);
  const axU = s.get(scene.axU);
  const sweepU = s.get(scene.sweepU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const si = Math.max(0, Math.min(SWEEP.length - 1, sweepU));
  const now = SWEEP[Math.min(SWEEP.length - 1, Math.round(si))];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the tree, level by level */}
          {SHOW_LEVELS.map((lvl, d) => {
            const u = clamp01(treeU - d);
            if (u <= 0) return null;
            const n = lvl.cands.length;
            return (
              <g key={d} opacity={u}>
                {lvl.cands.map((c, i) => {
                  const beamHit = c.kept && beamU > 0;
                  const greedyHit = c.greedy && greedyU > 0;
                  const r = c.on ? 7 : 4.5;
                  return (
                    <g key={c.path}>
                      <circle
                        cx={lvlX(d + 1)}
                        cy={nodeY(i, n)}
                        r={beamHit ? r + 2 : r}
                        fill={c.on ? colors.POSITIVE : colors.MUTED}
                        opacity={c.on ? 0.95 : c.kept && beamU > 0 ? 0.75 : 0.3}
                        stroke={
                          greedyHit ? colors.WARM : beamHit ? colors.ACCENT : 'none'
                        }
                        strokeWidth={greedyHit || beamHit ? 2.4 : 0}
                      />
                    </g>
                  );
                })}
                <text x={lvlX(d + 1)} y={nodeY(n - 1, n) + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  {`fork ${d + 1}`}
                </text>
              </g>
            );
          })}
          {treeU > 0.5 && (
            <g opacity={clamp01(treeU)}>
              <circle cx={lvlX(0)} cy={nodeY(0.5, 2)} r={8} fill={colors.TEXT} opacity={0.85} />
              <text x={lvlX(0)} y={nodeY(0.5, 2) - 18} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                start
              </text>
              <text x={lvlX(3)} y={72} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                one real reasoning tree · green = the correct derivation
              </text>
            </g>
          )}
          {greedyU > 0.5 && (
            <text x={lvlX(1)} y={nodeY(0, 3) - 24} fill={colors.WARM} fontSize={12.5} opacity={greedyU}>
              greedy commits here — wrong
            </text>
          )}
          {beamU > 0.5 && (
            <text x={lvlX(D)} y={92} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} opacity={beamU}>
              beam of 4 keeps the green path alive
            </text>
          )}

          {/* the sweep chart */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={chX(0) - 6} y1={CH_Y0} x2={chX(190) + 8} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={chX(0) - 6} y1={CH_Y0} x2={chX(0) - 6} y2={chY(0.9)} stroke={colors.GRID} />
              <text x={chX(95)} y={CH_Y0 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                nodes expanded per problem →
              </text>
              <text x={chX(0) - 16} y={chY(0.8) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                0.8
              </text>
            </g>
          )}
          {sweepU > 0 && (
            <g>
              <path
                d={SWEEP.slice(0, Math.ceil(si) + 1)
                  .map((p, i) => `${i === 0 ? 'M' : 'L'}${chX(p.nodes).toFixed(1)} ${chY(p.success).toFixed(1)}`)
                  .join('')}
                fill="none"
                stroke={colors.ACCENT}
                strokeWidth={3}
              />
              {SWEEP.slice(0, Math.ceil(si) + 1).map((p) => (
                <g key={p.w}>
                  <circle cx={chX(p.nodes)} cy={chY(p.success)} r={4.5} fill={colors.ACCENT} />
                  <text x={chX(p.nodes)} y={chY(p.success) - 12} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                    {`w=${p.w}`}
                  </text>
                </g>
              ))}
              <text x={chX(now.nodes) + 12} y={chY(now.success) + 20} fill={colors.ACCENT} fontSize={13}>
                {`${(now.success * 100).toFixed(0)}% at ${now.nodes} nodes`}
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
            Search Over Reasoning
          </text>
          <MathLabel
            tex={`\\text{greedy}: ${(GREEDY.success * 100).toFixed(0)}\\%\\ (${GREEDY.nodes}\\ \\text{nodes}) \\quad \\to \\quad \\text{beam 16}: ${(BEST.success * 100).toFixed(0)}\\%\\ (${BEST.nodes})`}
            x={640}
            y={340}
            fontSize={19}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            don't let one noisy opinion kill the right path
          </text>
        </g>
      )}
    </>
  );
}

export function ReasoningSearch() {
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
