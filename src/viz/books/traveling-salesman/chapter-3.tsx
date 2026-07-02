// Book scene — traveling-salesman, chapter 3: "The Greedy Trap".
// Nearest-neighbour construction: from home, always hop to the closest unvisited
// city. Fast and intuitive, but it commits early and pays late — the last city is
// stranded, and the forced return edge slices back across the whole map. On the
// seeded map the greedy tour is 265.2 vs the optimum 192.6 — 38% worse. This is
// the kind of starting tour setup_initial_solution hands to local search next.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { bruteForce, distanceMatrix, makeCities, nearestNeighbor, place, tourPoints } from './tsp';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout —————
const MAP = { x: 96, y: 92, w: 620, h: 460 };
const N = 9;
const CITIES = makeCities(17, N);
const STAGED = CITIES.map((p) => place(p, MAP));
const D = distanceMatrix(CITIES);
const NN = nearestNeighbor(D, 0); // greedy tour, really built on the coordinates
const OPT = bruteForce(D);
const GAP = ((NN.len - OPT.len) / OPT.len) * 100;
const PANEL = { x: 792, y: 170 };

// closed NN edge list (n edges); the last is the stranded return
const NN_EDGES = NN.order.map((c, k) => [c, NN.order[(k + 1) % N]] as [number, number]);

export function buildScene() {
  const tl = new Timeline();

  const cityU = tl.channel('cityU', 0);
  const homeU = tl.channel('homeU', 0);
  const buildU = tl.channel('buildU', 0); // 0..N edges drawn (open path first)
  const strandU = tl.channel('strandU', 0); // the long return edge
  const optGhostU = tl.channel('optGhostU', 0); // ghost of the true optimum
  const gapU = tl.channel('gapU', 0);
  const handoffU = tl.channel('handoffU', 0); // the greedy tour as local search's x0

  // BEAT 0 — greedy: from home, hop to the nearest unvisited city
  tl.caption({ at: 0.3, dur: 4.2, text: 'Greedy: from home, always hop to the nearest city not yet seen.' });
  tl.tween(cityU, 1, { at: 0.5, dur: 1.2, ease: ease.enter });
  tl.tween(homeU, 1, { at: 1.4, dur: 0.5, ease: ease.pop });
  tl.tween(buildU, 5, { at: 2.0, dur: 2.8, ease: ease.linear }); // first 5 hops
  tl.hold(5.2, 0.8);

  // BEAT 1 — fast and it feels right: cheap local choices
  tl.caption({ at: 6.2, dur: 3.8, text: 'Cheap, local choices — no lookahead. It feels obviously right.' });
  tl.tween(buildU, 8, { at: 6.5, dur: 2.4, ease: ease.linear }); // hops up to the last city
  tl.hold(9.8, 0.8);

  // BEAT 2 — the last city is stranded; the return slices across the map
  tl.caption({ at: 10.8, dur: 4.2, text: 'But the last city is stranded — the return edge slices the whole map.' });
  tl.tween(buildU, 9, { at: 11.1, dur: 0.6, ease: ease.linear });
  tl.tween(strandU, 1, { at: 11.7, dur: 1.0, ease: ease.draw });
  tl.hold(14.6, 0.8);

  // BEAT 3 — 265 vs 193: greedy commits early and pays late
  tl.caption({ at: 15.6, dur: 4.6, text: 'Greedy 265 against the optimum 193 — 38% worse. It pays for lookahead.' });
  tl.tween(optGhostU, 1, { at: 15.9, dur: 1.2, ease: ease.draw });
  tl.tween(gapU, 1, { at: 16.6, dur: 0.8, ease: ease.enter });
  tl.hold(19.8, 0.8);

  // BEAT 4 — but it is a fine starting tour: local search takes it from here
  tl.caption({ at: 20.8, dur: 4.4, text: 'Still, it is a fine x0 — the starting tour local search improves next.' });
  tl.tween(handoffU, 1, { at: 21.2, dur: 0.9, ease: ease.enter });
  tl.hold(25.2, 1.2);

  return { tl, cityU, homeU, buildU, strandU, optGhostU, gapU, handoffU };
}

const scene = buildScene();

/** A tour edge with draw-on fraction. */
function Edge({ a, b, u, color, width = 2.4, dash }: { a: number; b: number; u: number; color: string; width?: number; dash?: boolean }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const p = STAGED[a];
  const q = STAGED[b];
  const x = p.x + (q.x - p.x) * uu;
  const y = p.y + (q.y - p.y) * uu;
  return <line x1={p.x} y1={p.y} x2={x} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash ? '6 5' : undefined} />;
}

export function Render({ s }: { s: SceneState }) {
  const cityU = clamp01(s.get(scene.cityU));
  const build = s.get(scene.buildU); // 0..9
  const strandU = clamp01(s.get(scene.strandU));
  const optGhostU = clamp01(s.get(scene.optGhostU));
  const gapU = clamp01(s.get(scene.gapU));
  const handoffU = clamp01(s.get(scene.handoffU));
  const visited = Math.min(N, Math.floor(build) + 1);

  return (
    <>
      <rect x={MAP.x - 24} y={MAP.y - 24} width={MAP.w + 48} height={MAP.h + 48} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />

      {/* ghost of the true optimum, for comparison */}
      {optGhostU > 0 && (
        <polyline points={tourPoints(OPT.order, STAGED)} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={0.45 * optGhostU} strokeDasharray="4 5" strokeLinejoin="round" />
      )}

      {/* the greedy tour, built hop by hop (first N−1 open edges) */}
      {NN_EDGES.slice(0, N - 1).map(([a, b], k) => (
        <Edge key={k} a={a} b={b} u={clamp01(build - k)} color={colors.ACCENT} />
      ))}
      {/* the stranded return edge */}
      <Edge a={NN_EDGES[N - 1][0]} b={NN_EDGES[N - 1][1]} u={strandU} color={colors.NEGATIVE} width={2.8} />

      {/* cities, lit as the greedy walk reaches them */}
      {STAGED.map((p, i) => {
        const e = clamp01(cityU * N - i);
        if (e <= 0) return null;
        const orderIdx = NN.order.indexOf(i);
        const reached = orderIdx < visited;
        const isHome = i === 0;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={isHome ? 8.5 : 6} fill={isHome ? colors.WARM : reached ? colors.ACCENT : colors.MUTED} opacity={e} />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={e * 0.85}>
              {isHome ? 'home' : i}
            </text>
          </g>
        );
      })}

      {/* strand callout */}
      {strandU > 0.4 && (
        <text x={STAGED[NN_EDGES[N - 1][0]].x} y={STAGED[NN_EDGES[N - 1][0]].y + 22} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={700} fontFamily={mono} opacity={strandU}>
          stranded
        </text>
      )}

      {/* right panel — lengths */}
      <g transform={`translate(${PANEL.x}, ${PANEL.y})`}>
        {build > 0.5 && (
          <>
            <text x={0} y={0} fill={colors.ACCENT} fontSize={15} fontFamily={mono}>
              nearest-neighbour
            </text>
            <text x={0} y={40} fill={colors.ACCENT} fontSize={34} fontWeight={700} fontFamily={mono}>
              {NN.len.toFixed(1)}
            </text>
          </>
        )}
        {gapU > 0.01 && (
          <g opacity={gapU}>
            <text x={0} y={104} fill={colors.POSITIVE} fontSize={15} fontFamily={mono}>
              optimum
            </text>
            <text x={0} y={144} fill={colors.POSITIVE} fontSize={34} fontWeight={700} fontFamily={mono}>
              {OPT.len.toFixed(1)}
            </text>
            <text x={0} y={210} fill={colors.NEGATIVE} fontSize={26} fontWeight={700} fontFamily={mono}>
              +{GAP.toFixed(0)}%
            </text>
            <text x={0} y={236} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
              greedy commits early
            </text>
          </g>
        )}
        {handoffU > 0.01 && (
          <g opacity={handoffU} transform="translate(0, 288)">
            <rect x={-6} y={-22} width={280} height={30} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={10} y={-2} fill={colors.ACCENT} fontSize={13} fontFamily={mono}>
              x0 → solve_tsp_local_search
            </text>
          </g>
        )}
      </g>
    </>
  );
}

export const vizScene = () => scene;
