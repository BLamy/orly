import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  LAYERS,
  NBRS,
  N,
  PTS,
  SEARCH,
  TRUE_NN,
  buildScene,
  projX,
  projY,
  qX,
  qY,
} from './scene';

/**
 * HNSW — pure render. Layers, links, and the descent are the real index and
 * real recorded greedy search from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/hnsw/overrides.json', slug: 'hnsw' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const LAYER_COLOR = [colors.ACCENT, colors.SECONDARY, colors.WARM];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const flatU = s.get(scene.flatU);
  const linkU = s.get(scene.linkU);
  const explode = s.get(scene.explode);
  const queryU = s.get(scene.queryU);
  const hopU = s.get(scene.hopU);
  const statU = s.get(scene.statU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // walker position (interpolated between recorded hops)
  const hf = Math.max(0, Math.min(SEARCH.path.length - 1, hopU));
  const hi = Math.floor(hf);
  const ht = hf - hi;
  const hopA = SEARCH.path[hi];
  const hopB = SEARCH.path[Math.min(SEARCH.path.length - 1, hi + 1)];
  const walkerX = lerp(projX(hopA.node), projX(hopB.node), ht);
  const walkerY = lerp(projY(hopA.node, hopA.layer, explode), projY(hopB.node, hopB.layer, explode), ht);
  const compsNow = Math.round((hf / (SEARCH.path.length - 1)) * SEARCH.comps);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* layer planes (exploded view) */}
          {explode > 0.05 &&
            [2, 1, 0].map((L) => {
              const yMid = 340 * 0.28 + 240 * (1 - 0.28) + [150, -10, -170][L];
              const rows = L === 0 ? [`layer 0`, `all ${N} points`, `short edges`] : [`layer ${L}`, `${LAYERS[L].length} points`, `long edges`];
              return (
                <g key={L} opacity={explode * 0.9}>
                  <rect
                    x={120}
                    y={yMid - 78}
                    width={1040}
                    height={156}
                    rx={16}
                    fill={LAYER_COLOR[L]}
                    opacity={0.05}
                    stroke={LAYER_COLOR[L]}
                    strokeWidth={1}
                  />
                  {/* labels sit in the left margin, clear of the nodes */}
                  {rows.map((row, r) => (
                    <text
                      key={r}
                      x={18}
                      y={yMid - 18 + r * 18}
                      fill={LAYER_COLOR[L]}
                      fontSize={14}
                      fontWeight={r === 0 ? 650 : 450}
                    >
                      {row}
                    </text>
                  ))}
                </g>
              );
            })}

          {/* links per layer */}
          {[0, 1, 2].map((L) =>
            LAYERS[L].flatMap((i) =>
              (NBRS[L][i] ?? []).map((j) => {
                if (j < i) return null; // draw each edge once
                const show = L === 0 ? linkU : explode;
                if (show <= 0.02) return null;
                return (
                  <line
                    key={`${L}-${i}-${j}`}
                    x1={projX(i)}
                    y1={projY(i, L, explode)}
                    x2={projX(j)}
                    y2={projY(j, L, explode)}
                    stroke={LAYER_COLOR[L]}
                    strokeWidth={L === 0 ? 1 : 1.6}
                    opacity={0.28 * show}
                  />
                );
              }),
            ),
          )}

          {/* nodes per layer */}
          {[0, 1, 2].map((L) =>
            LAYERS[L].map((i) => {
              const u = clamp01(flatU * 1.6 - i / N);
              if (u <= 0) return null;
              const isFound = i === SEARCH.found && hopU >= SEARCH.path.length - 1 && L === 0;
              return (
                <circle
                  key={`${L}-${i}`}
                  cx={projX(i)}
                  cy={projY(i, L, explode)}
                  r={isFound ? 8 : L === 0 ? 4 : 5}
                  fill={isFound ? colors.POSITIVE : LAYER_COLOR[L]}
                  opacity={u * (L === 0 ? 0.8 : 0.95) * (L > 0 ? explode : 1)}
                  stroke={isFound ? colors.BG : 'none'}
                  strokeWidth={isFound ? 2 : 0}
                />
              );
            }),
          )}

          {/* the recorded path so far */}
          {hopU > 0 && (
            <polyline
              points={SEARCH.path
                .slice(0, hi + 1)
                .map((h) => `${projX(h.node)},${projY(h.node, h.layer, explode)}`)
                .concat([`${walkerX},${walkerY}`])
                .join(' ')}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={2.5}
              opacity={0.85}
            />
          )}

          {/* the query (lives on the ground floor) */}
          {queryU > 0 && (
            <g opacity={queryU}>
              <circle cx={qX} cy={qY(explode)} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />
              <text x={qX + 4} y={qY(explode) + 26} fill={colors.WARM} fontSize={14}>
                query
              </text>
            </g>
          )}

          {/* the walker */}
          {hopU > 0 && <circle cx={walkerX} cy={walkerY} r={7.5} fill={colors.WARM} stroke={colors.BG} strokeWidth={2} />}

          {/* the receipt: sits in the open band under the bottom layer */}
          {statU > 0 && (
            <g opacity={statU}>
              <rect x={880} y={508} width={330} height={84} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
              <text x={900} y={533} fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                {`found node ${SEARCH.found} — the true nearest`}
              </text>
              <text x={900} y={555} fill={colors.TEXT} fontSize={14.5}>
                {`${SEARCH.comps} comparisons vs ${N} brute force`}
              </text>
              <text x={900} y={577} fill={colors.MUTED} fontSize={14}>
                {`true nn ${TRUE_NN} — verified by full scan`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* comparison counter: a fixed HUD strip, so no node can sit under it */}
      {hopU > 0 && (
        <g opacity={dimU * (1 - endU)}>
          <rect x={130} y={592} width={320} height={34} rx={9} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={148} y={614} fill={colors.TEXT} fontSize={15}>
            {`distance computations: ${compsNow} / ${SEARCH.comps}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={1} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            HNSW
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.ACCENT} fontSize={22}>
            {'comparisons ~ O(log N)   vs   O(N)'}
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a skip list in space: express floors, a precise ground floor, one greedy walker
          </text>
        </g>
      )}
    </>
  );
}

export function Hnsw() {
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
