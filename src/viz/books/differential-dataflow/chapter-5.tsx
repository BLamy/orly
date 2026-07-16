// Until the Differences Dissipate
//
// Grounding: operators/iterate.rs — "The implementation of `iterate` does not
// directly apply the closure, but rather establishes an iterative timely
// dataflow subcomputation, in which differences circulate until they
// dissipate (indicating that the computation has reached fixed point)";
// Variable; enter/leave. The loop body is README.md's reachability fragment,
// verbatim: roots.iterate(|scope, reach| edges.enter(scope).semijoin(reach)
// .map(|(src, dst)| dst).concat(reach).distinct()) — examples/bfs.rs is the
// same shape. The batch-vs-incremental pitch is the README's own: react to
// changes in `edges` or `roots` and "only act where changes occur".
//
// Centerpiece: a REACHABILITY WAVEFRONT and a DELTA METER, joined by the
// iterate ring. Each lap of the ring floods one more layer of the graph while
// the meter logs how many differences circulated: three, four, two — zero.
// The loop goes quiet by arithmetic. Then ONE edge is added to the settled
// graph: two tiny laps, two nodes, quiet again — while batch would re-flood
// everything. Ends on the whole-book recap.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The graph (module scope): BFS layers precomputed by construction.
// ---------------------------------------------------------------------------

type GNode = { id: string; x: number; y: number; layer: number };
// layer = BFS depth from the root; -1 = unreachable until the new edge lands.
const NODES: GNode[] = [
  { id: 'root', x: 128, y: 322, layer: 0 },
  { id: 'a', x: 268, y: 196, layer: 1 },
  { id: 'b', x: 272, y: 330, layer: 1 },
  { id: 'c', x: 264, y: 458, layer: 1 },
  { id: 'd', x: 416, y: 150, layer: 2 },
  { id: 'e', x: 420, y: 274, layer: 2 },
  { id: 'f', x: 424, y: 392, layer: 2 },
  { id: 'g', x: 412, y: 500, layer: 2 },
  { id: 'h', x: 564, y: 210, layer: 3 },
  { id: 'i', x: 568, y: 452, layer: 3 },
  { id: 'u', x: 660, y: 120, layer: -1 }, // reachable only after the new edge
  { id: 'v', x: 776, y: 176, layer: -2 }, // one hop past u
];
const N = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, GNode>;

const EDGES: Array<[string, string]> = [
  ['root', 'a'],
  ['root', 'b'],
  ['root', 'c'],
  ['a', 'd'],
  ['b', 'e'],
  ['b', 'f'],
  ['c', 'g'],
  ['d', 'h'],
  ['g', 'i'],
  ['u', 'v'], // exists all along, but unreachable
];
const NEW_EDGE: [string, string] = ['e', 'u'];

/** deltas circulated per lap of the initial flood, then after the new edge */
const DELTAS_1 = [3, 4, 2, 0];
const DELTAS_2 = [1, 1, 0];

// the iterate ring
const RING = { x: 1010, y: 268, r: 118 };
const RING_STOPS = ['enter', 'semijoin', 'map', 'concat', 'distinct'];
const ringPt = (frac: number, roff = 0) => ({
  x: RING.x + (RING.r + roff) * Math.cos(-Math.PI / 2 + frac * 2 * Math.PI),
  y: RING.y + (RING.r + roff) * Math.sin(-Math.PI / 2 + frac * 2 * Math.PI),
});

// the delta meter (persistent across both phases)
const METER = { x0: 130, y: 596, w: 44, gap: 30, unit: 17 };
const meterX = (j: number) => METER.x0 + j * (METER.w + METER.gap) + METER.w / 2;
const METER_LABELS = ['lap 1', 'lap 2', 'lap 3', 'lap 4', 'lap 1', 'lap 2', 'lap 3'];

const CAM_GRAPH: CameraState = { x: 520, y: 330, k: 1.14 };
const CAM_RING: CameraState = { x: 940, y: 300, k: 1.3 };
const CAM_EDGE: CameraState = { x: 620, y: 220, k: 1.5 };

// node light-up time (in lapU units) — reachable layer L lights as lap L ends
const litAt = (layer: number) => layer - 0.2;

// ---------------------------------------------------------------------------
// Timeline (~92s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_GRAPH, cameraInterp);

  const graphU = tl.channel('graphU', 0);
  const ringU = tl.channel('ringU', 0);
  const codeU = tl.channel('codeU', 0);
  const lapU = tl.channel('lapU', 0); // 0..4 — initial flood laps
  const meterU = tl.channel('meterU', 0); // meter scaffold
  const quietU = tl.channel('quietU', 0); // fixed-point badge
  const newEdgeU = tl.channel('newEdgeU', 0); // the added edge
  const lap2U = tl.channel('lap2U', 0); // 0..3 — incremental laps
  const contrastU = tl.channel('contrastU', 0); // batch-vs-diff chip
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0); // the five-tile recap

  // — beat 1 · queries that feed on themselves —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Some queries refuse to run in one pass. Which nodes can you reach from the root? Reachability feeds on its own answer — you need a loop.',
  });
  tl.tween(graphU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });

  // — beat 2 · iterate: the loop as an operator —
  tl.caption({
    at: 7.2,
    dur: 7.4,
    text: 'Differential dataflow makes the loop an operator called iterate. The reached set enters a nested scope, joins with the edges, the found nodes are added, and only the distinct ones survive the lap.',
  });
  tl.tween(cam, CAM_RING, { at: 7.4, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: 8.0, dur: 1.8, ease: ease.draw });
  tl.tween(codeU, 1, { at: 10.2, dur: 0.7, ease: ease.enter });

  // — beat 3 · lap one —
  tl.caption({
    at: 15.4,
    dur: 6.6,
    text: 'And what circulates around this ring is not the set of nodes. It is the differences. First lap: three new nodes, three plus ones.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 15.6, dur: 1.3, ease: ease.move });
  tl.tween(meterU, 1, { at: 16.0, dur: 0.8, ease: ease.enter });
  tl.tween(lapU, 1, { at: 17.2, dur: 3.6, ease: ease.linear });

  // — beat 4 · laps two and three —
  tl.caption({
    at: 22.8,
    dur: 6.6,
    text: 'Each lap discovers less than the one before. Four new nodes, then two. The differences are dissipating.',
  });
  tl.tween(lapU, 3, { at: 23.4, dur: 5.4, ease: ease.linear });

  // — beat 5 · the loop goes quiet —
  tl.caption({
    at: 30.4,
    dur: 7.2,
    text: 'Then a lap finds nothing at all. Zero differences means nothing changed, and nothing changed means fixed point. The loop is not stopped by decree — it goes quiet by arithmetic.',
  });
  tl.tween(lapU, 4, { at: 31.0, dur: 2.4, ease: ease.linear });
  tl.tween(quietU, 1, { at: 34.0, dur: 0.6, ease: ease.pop });

  // — beat 6 · one edge, much later —
  tl.caption({
    at: 38.6,
    dur: 6.4,
    text: 'Now the moment this whole book was building toward. Long after the loop went quiet, one edge is added to the graph — from a settled node to one nobody could reach.',
  });
  tl.tween(cam, CAM_EDGE, { at: 38.8, dur: 1.4, ease: ease.move });
  tl.tween(codeU, 0, { at: 38.8, dur: 0.7, ease: ease.enter });
  tl.tween(quietU, 0, { at: 39.0, dur: 0.6, ease: ease.enter });
  tl.tween(newEdgeU, 1, { at: 41.6, dur: 0.9, ease: ease.pop });

  // — beat 7 · the ripple —
  tl.caption({
    at: 45.8,
    dur: 7.0,
    text: 'That single difference drops into the settled loop. One lap finds one node. The next finds one more. Then — quiet again. The fixed point simply absorbed the change.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 46.0, dur: 1.3, ease: ease.move });
  tl.tween(lap2U, 3, { at: 47.2, dur: 5.2, ease: ease.linear });

  // — beat 8 · where it crushes batch —
  tl.caption({
    at: 53.6,
    dur: 7.0,
    text: 'A batch system would have re-flooded all twelve nodes to learn that. Differential dataflow touched two. Small changes against big, settled state — that is where incremental computation crushes batch.',
  });
  tl.tween(contrastU, 1, { at: 55.4, dur: 0.7, ease: ease.pop });

  // — beat 9 · the recap —
  tl.caption({
    at: 61.6,
    dur: 8.4,
    text: 'So retrace the whole machine. Collections are ledgers of differences. Operators ship them. Arrangements remember them. Frontiers commit them. And loops run until the differences dissipate.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 61.8, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 62.0, dur: 1.1, ease: ease.move });
  tl.tween(recapU, 5, { at: 63.2, dur: 4.6, ease: ease.enter });
  tl.caption({
    at: 70.8,
    dur: 4.6,
    text: 'Work proportional to the change, answers you can trust, loops that settle. One difference at a time.',
  });
  tl.hold(75.6, 1.4);

  return {
    tl,
    cam,
    graphU,
    ringU,
    codeU,
    lapU,
    meterU,
    quietU,
    newEdgeU,
    lap2U,
    contrastU,
    dimU,
    recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** How lit a node is: initial flood via lapU, the two stragglers via lap2U. */
function nodeLit(n: GNode, lapU: number, lap2U: number): number {
  if (n.layer === 0) return 1;
  if (n.layer > 0) return clamp01((lapU - litAt(n.layer)) * 5);
  if (n.layer === -1) return clamp01((lap2U - 0.8) * 5);
  return clamp01((lap2U - 1.8) * 5);
}

const RECAP = [
  { title: 'ledger', sub: '(data, time, diff)' },
  { title: 'ship diffs', sub: 'map · join · count' },
  { title: 'arrange', sub: 'batches → trace' },
  { title: 'frontier', sub: 'commit the past' },
  { title: 'iterate', sub: 'until diffs = 0' },
];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const graphU = s.get(scene.graphU);
  const ringU = s.get(scene.ringU);
  const codeU = s.get(scene.codeU);
  const lapU = s.get(scene.lapU);
  const meterU = s.get(scene.meterU);
  const quietU = s.get(scene.quietU);
  const newEdgeU = s.get(scene.newEdgeU);
  const lap2U = s.get(scene.lap2U);
  const contrastU = s.get(scene.contrastU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);

  const stageOp = 1 - 0.87 * dimU;

  // the pulse orbiting the ring: active during either lap phase
  const orbiting = (lapU > 0 && lapU < 4) || (lap2U > 0 && lap2U < 3);
  const orbitFrac = lapU < 4 && lapU > 0 ? lapU % 1 : lap2U % 1;
  const orbit = ringPt(orbitFrac, -14);

  // meter bar heights: initial laps then incremental laps on one shared rack
  const barVal = (j: number): { v: number; u: number } => {
    if (j < 4) return { v: DELTAS_1[j], u: clamp01((lapU - (j + 0.82)) * 6) };
    return { v: DELTAS_2[j - 4], u: clamp01((lap2U - (j - 4 + 0.82)) * 6) };
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ---------------- the graph ---------------- */}
          {graphU > 0.01 && (
            <g opacity={graphU}>
              {EDGES.map(([p, q], i) => {
                const a = N[p];
                const b = N[q];
                const litP = nodeLit(a, lapU, lap2U);
                const litQ = nodeLit(b, lapU, lap2U);
                const flowing = Math.min(litP, litQ);
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={flowing > 0.5 ? colors.POSITIVE : colors.GRID}
                    strokeWidth={flowing > 0.5 ? 2.6 : 1.6}
                    opacity={0.45 + 0.55 * flowing}
                    markerEnd="url(#dd5-arrow)"
                  />
                );
              })}
              {newEdgeU > 0.01 && (
                <line
                  x1={N.e.x}
                  y1={N.e.y}
                  x2={N.e.x + (N.u.x - N.e.x) * clamp01(newEdgeU * 1.3)}
                  y2={N.e.y + (N.u.y - N.e.y) * clamp01(newEdgeU * 1.3)}
                  stroke={colors.WARM}
                  strokeWidth={3}
                  markerEnd={newEdgeU > 0.75 ? 'url(#dd5-arrow-warm)' : undefined}
                />
              )}
              {NODES.map((n) => {
                const lit = nodeLit(n, lapU, lap2U);
                const pop = lit > 0 && lit < 1 ? Math.sin(lit * Math.PI) : 0;
                return (
                  <g key={n.id}>
                    {lit > 0.4 && <circle cx={n.x} cy={n.y} r={20 + 5 * pop} fill={colors.POSITIVE} opacity={0.16 + 0.1 * pop} />}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={15 + 3 * pop}
                      fill={lit > 0.4 ? colors.POSITIVE : colors.PANEL}
                      stroke={n.id === 'root' ? colors.ACCENT : colors.GRID}
                      strokeWidth={n.id === 'root' ? 2.5 : 1.5}
                      opacity={0.9}
                    />
                    {n.id === 'root' && (
                      <text x={n.x} y={n.y - 26} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
                        roots
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ---------------- the iterate ring ---------------- */}
          {ringU > 0.01 && (
            <g opacity={ringU}>
              <circle cx={RING.x} cy={RING.y} r={RING.r} fill="none" stroke={colors.GRID} strokeWidth={2} strokeDasharray={`${2 * Math.PI * RING.r * clamp01(ringU)} ${2 * Math.PI * RING.r}`} transform={`rotate(-90 ${RING.x} ${RING.y})`} />
              <text x={RING.x} y={RING.y - 6} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontWeight={650}>
                iterate
              </text>
              <text x={RING.x} y={RING.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                nested scope
              </text>
              {RING_STOPS.map((st, i) => {
                const p = ringPt(i / RING_STOPS.length);
                return (
                  <g key={st}>
                    <circle cx={p.x} cy={p.y} r={7} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
                    <text
                      x={ringPt(i / RING_STOPS.length, 26).x}
                      y={ringPt(i / RING_STOPS.length, 26).y + 4}
                      textAnchor="middle"
                      fill={colors.SECONDARY}
                      fontSize={12.5}
                      fontFamily={MONO}
                    >
                      {st}
                    </text>
                  </g>
                );
              })}
              {orbiting && (
                <circle cx={orbit.x} cy={orbit.y} r={7} fill={colors.POSITIVE}>
                  {null}
                </circle>
              )}
              {quietU > 0.01 && (
                <g opacity={quietU}>
                  <rect x={RING.x - 96} y={RING.y + RING.r + 18} width={192} height={34} rx={9} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
                  <text x={RING.x} y={RING.y + RING.r + 40} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontFamily={MONO}>
                    0 diffs → fixed point
                  </text>
                </g>
              )}
            </g>
          )}
          {codeU > 0.01 && (
            <g opacity={codeU}>
              <rect x={764} y={452} width={492} height={54} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={784} y={474} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                {'roots.iterate(|scope, reach| edges.enter(scope)'}
              </text>
              <text x={784} y={492} fill={colors.ACCENT} fontSize={11.5} fontFamily={MONO}>
                {'  .semijoin(reach).map(|(src, dst)| dst).concat(reach).distinct())'}
              </text>
            </g>
          )}

          {/* ---------------- the delta meter ---------------- */}
          {meterU > 0.01 && (
            <g opacity={meterU}>
              <line x1={METER.x0 - 20} y1={METER.y} x2={METER.x0 + 7 * (METER.w + METER.gap)} y2={METER.y} stroke={colors.GRID} strokeWidth={2} />
              <text x={METER.x0 - 20} y={METER.y - 78} fill={colors.MUTED} fontSize={13} fontStyle="italic">
                differences circulated, per lap
              </text>
              {METER_LABELS.map((lb, j) => {
                const { v, u } = barVal(j);
                if (u <= 0.01) return null;
                const h = Math.max(3, v * METER.unit) * u;
                const isZero = v === 0;
                return (
                  <g key={j} opacity={u}>
                    <rect
                      x={meterX(j) - METER.w / 2}
                      y={METER.y - h}
                      width={METER.w}
                      height={h}
                      rx={4}
                      fill={isZero ? colors.MUTED : j < 4 ? colors.ACCENT : colors.WARM}
                      opacity={isZero ? 0.45 : 0.85}
                    />
                    <text x={meterX(j)} y={METER.y - h - 7} textAnchor="middle" fill={isZero ? colors.POSITIVE : colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                      {v}
                    </text>
                    <text x={meterX(j)} y={METER.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                      {lb}
                    </text>
                  </g>
                );
              })}
              {lap2U > 0.05 && (
                <text x={meterX(4) - METER.w / 2 - 8} y={METER.y - 62} fill={colors.WARM} fontSize={11.5} fontStyle="italic" opacity={clamp01(lap2U * 2)}>
                  + one edge
                </text>
              )}
            </g>
          )}

          {/* ---------------- batch vs differential ---------------- */}
          {contrastU > 0.01 && (
            <g opacity={contrastU}>
              <rect x={806} y={80} width={368} height={78} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={830} y={112} fill={colors.NEGATIVE} fontSize={14.5} fontWeight={600}>
                batch: re-flood all 12 nodes
              </text>
              <text x={830} y={140} fill={colors.POSITIVE} fontSize={14.5} fontWeight={600}>
                differential: 2 touched, 2 laps
              </text>
            </g>
          )}
        </g>

        {/* ---------------- the recap ---------------- */}
        {recapU > 0.01 && (
          <g>
            <rect x={110} y={214} width={1060} height={270} rx={18} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} opacity={clamp01(recapU * 2)} />
            <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={650} opacity={clamp01(recapU * 2)}>
              Differential dataflow, end to end
            </text>
            {RECAP.map((r, i) => {
              const u = clamp01(recapU - i);
              if (u <= 0.01) return null;
              const x = 218 + i * 212;
              return (
                <g key={r.title} opacity={u}>
                  <rect x={x - 84} y={300 - (1 - u) * 14} width={168} height={112} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={x} y={342 - (1 - u) * 14} textAnchor="middle" fill={colors.ACCENT} fontSize={17} fontWeight={650}>
                    {r.title}
                  </text>
                  <text x={x} y={372 - (1 - u) * 14} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                    {r.sub}
                  </text>
                  {i < 4 && (
                    <text x={x + 100} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={18} opacity={u}>
                      →
                    </text>
                  )}
                </g>
              );
            })}
            <text x={640} y={452} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic" opacity={clamp01(recapU - 4)}>
              incremental computation, one difference at a time
            </text>
          </g>
        )}
      </Camera>
      <defs>
        <marker id="dd5-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.GRID} />
        </marker>
        <marker id="dd5-arrow-warm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.WARM} />
        </marker>
      </defs>
    </>
  );
}

export const vizScene = () => scene;
