import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
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
  TREE_H,
  TREE_Y0,
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
const pct = (p: { success: number }): string => `${(p.success * 100).toFixed(0)}%`;

// where a candidate hangs from: the start node for fork 1, else its parent one level up
const FORK_LABEL_Y = TREE_Y0 + TREE_H + 40;
function parentOf(d: number, path: string): [number, number] {
  if (d === 0) return [lvlX(0), nodeY(0.5, 2)];
  const prev = SHOW_LEVELS[d - 1].cands;
  const pi = prev.findIndex((p) => p.path === path.slice(0, -1));
  return [lvlX(d), nodeY(pi, prev.length)];
}

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
          {/* the tree, level by level; it steps back while the chart is the subject */}
          <g opacity={1 - axU}>
            {SHOW_LEVELS.map((lvl, d) => {
              const u = clamp01(treeU - d);
              if (u <= 0) return null;
              const n = lvl.cands.length;
              return (
                <g key={d} opacity={u}>
                  {lvl.cands.map((c, i) => {
                    const [px, py] = parentOf(d, c.path);
                    const warm = c.greedy && greedyU > 0;
                    return (
                      <line
                        key={`e${c.path}`}
                        x1={px}
                        y1={py}
                        x2={lvlX(d + 1)}
                        y2={nodeY(i, n)}
                        stroke={c.on ? colors.POSITIVE : warm ? colors.WARM : colors.MUTED}
                        opacity={c.on ? 0.9 : warm ? 0.8 : 0.22}
                        strokeWidth={c.on || warm ? 2.2 : 1}
                      />
                    );
                  })}
                  {lvl.cands.map((c, i) => {
                    const beamHit = c.kept && beamU > 0;
                    const greedyHit = c.greedy && greedyU > 0;
                    const r = c.on ? 7 : 4.5;
                    return (
                      <circle
                        key={c.path}
                        cx={lvlX(d + 1)}
                        cy={nodeY(i, n)}
                        r={beamHit ? r + 2 : r}
                        fill={c.on ? colors.POSITIVE : colors.MUTED}
                        opacity={c.on ? 0.95 : c.kept && beamU > 0 ? 0.75 : 0.3}
                        stroke={greedyHit ? colors.WARM : beamHit ? colors.ACCENT : 'none'}
                        strokeWidth={greedyHit || beamHit ? 2.4 : 0}
                      />
                    );
                  })}
                  <text x={lvlX(d + 1)} y={FORK_LABEL_Y} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {`fork ${d + 1}`}
                  </text>
                </g>
              );
            })}
            {treeU > 0.5 && (
              <g opacity={clamp01(treeU)}>
                <circle cx={lvlX(0)} cy={nodeY(0.5, 2)} r={8} fill={colors.TEXT} opacity={0.85} />
                <text x={lvlX(0)} y={nodeY(0.5, 2) - 18} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  start
                </text>
                <text x={lvlX(3)} y={72} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  one real reasoning tree · green = the correct derivation
                </text>
              </g>
            )}
            {greedyU > 0.5 && (
              <text x={lvlX(1)} y={nodeY(0, 3) - 26} textAnchor="middle" fill={colors.WARM} fontSize={14} opacity={greedyU}>
                greedy commits here — wrong
              </text>
            )}
            {beamU > 0.5 && (
              <text x={lvlX(D) - 10} y={92} textAnchor="end" fill={colors.ACCENT} fontSize={14} opacity={beamU}>
                beam of 4 keeps the green path alive
              </text>
            )}
          </g>

          {/* the sweep chart */}
          {axU > 0 && (
            <g opacity={axU}>
              {[0.4, 0.8].map((v) => (
                <line key={v} x1={chX(0) - 6} y1={chY(v)} x2={chX(190) + 8} y2={chY(v)} stroke={colors.GRID} opacity={0.35} />
              ))}
              <line x1={chX(0) - 6} y1={CH_Y0} x2={chX(190) + 8} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={chX(0) - 6} y1={CH_Y0} x2={chX(0) - 6} y2={chY(1)} stroke={colors.GRID} />
              {[0, 0.4, 0.8].map((v) => (
                <text key={v} x={chX(0) - 14} y={chY(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                  {v.toFixed(1)}
                </text>
              ))}
              {[0, 50, 100, 150].map((n) => (
                <text key={n} x={chX(n)} y={CH_Y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                  {n}
                </text>
              ))}
              <text x={chX(0) - 6} y={chY(1) - 10} textAnchor="start" fill={colors.MUTED} fontSize={14}>
                accuracy
              </text>
              <text x={chX(95)} y={CH_Y0 + 46} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                nodes expanded per problem →
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
                  <text x={chX(p.nodes)} y={chY(p.success) - 12} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {`w=${p.w}`}
                  </text>
                </g>
              ))}
              <text x={chX(now.nodes) + 12} y={chY(now.success) + 22} fill={colors.ACCENT} fontSize={15}>
                {`${pct(now)} at ${now.nodes} nodes`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* closing card: solid, so nothing of the faded chart shows through */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Search Over Reasoning
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
            {`greedy ${pct(GREEDY)} at ${GREEDY.nodes} nodes  →  beam 16 ${pct(BEST)} at ${BEST.nodes} nodes`}
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
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
