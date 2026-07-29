// Shipping the Difference
//
// Grounding: README.md — the out-degree distribution example, verbatim:
//   edges.map(|(src, _dst)| src).count().map(|(_src, deg)| deg).count()
// and its pitch: differential dataflow "only acts where changes in collections
// occur, and does no work elsewhere". examples/degrees.rs runs the same query
// with count_total (operators/count.rs, CountTotal).
//
// Centerpiece: a LIVE HISTOGRAM PAIR fed by the real four-operator rail. One
// new edge enters as a single (data, time, diff); the count answers with a
// retraction AND an assertion — one update in, two out, then four — while the
// bars tick exactly in step. The batch strawman re-reads everything first, so
// the contrast is visible, not asserted.
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
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// The graph (module scope, deterministic). Base edges, then B→D arrives.
// ---------------------------------------------------------------------------

const IDS = ['A', 'B', 'C', 'D', 'E'] as const;
type Id = (typeof IDS)[number];

const BASE_EDGES: Array<[Id, Id]> = [
  ['A', 'B'],
  ['A', 'C'],
  ['B', 'C'],
  ['C', 'D'],
  ['D', 'A'],
  ['D', 'B'],
];
const NEW_EDGE: [Id, Id] = ['B', 'D'];

function outDegrees(withNew: boolean): Record<Id, number> {
  const d: Record<Id, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const [src] of BASE_EDGES) d[src] += 1;
  if (withNew) d[NEW_EDGE[0]] += 1;
  return d;
}
const DEG0 = outDegrees(false); // A2 B1 C1 D2 E0
const DEG1 = outDegrees(true); // A2 B2 C1 D2 E0

function distribution(deg: Record<Id, number>): number[] {
  const dist = [0, 0, 0, 0];
  for (const id of IDS) dist[deg[id]] += 1;
  return dist;
}
const DIST0 = distribution(DEG0); // deg0:1 deg1:2 deg2:2 deg3:0
const DIST1 = distribution(DEG1); // deg0:1 deg1:1 deg2:3 deg3:0

// ---------------------------------------------------------------------------
// Layout. Rail across the top, graph bottom-left, two histograms right.
// ---------------------------------------------------------------------------

const RAIL_Y = 236;
const STOPS = [
  { key: 'src', x: 128, w: 118, label: 'edges', sub: 'Collection' },
  { key: 'map1', x: 348, w: 128, label: 'map', sub: '|(src, _dst)| src' },
  { key: 'cnt1', x: 568, w: 128, label: 'count', sub: 'per node' },
  { key: 'map2', x: 788, w: 128, label: 'map', sub: '|(_src, deg)| deg' },
  { key: 'cnt2', x: 1008, w: 128, label: 'count', sub: 'per degree' },
] as const;
const STOP_H = 54;
const stopX = (i: number) => STOPS[i].x;

const CODE = 'edges.map(|(src, _dst)| src).count().map(|(_src, deg)| deg).count()';

// graph, pentagon
const GC = { x: 226, y: 462 };
const GR = 96;
const NODE_POS: Record<Id, { x: number; y: number }> = Object.fromEntries(
  IDS.map((id, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [id, { x: GC.x + GR * Math.cos(a), y: GC.y + GR * Math.sin(a) }];
  }),
) as Record<Id, { x: number; y: number }>;

// degree bars (one per node)
const DEGB = { x0: 494, y: 588, w: 38, gap: 20, unit: 46 };
const degBarX = (i: number) => DEGB.x0 + i * (DEGB.w + DEGB.gap) + DEGB.w / 2;

// distribution bars (one per degree 0..3)
const DISTB = { x0: 884, y: 588, w: 44, gap: 26, unit: 40 };
const distBarX = (d: number) => DISTB.x0 + d * (DISTB.w + DISTB.gap) + DISTB.w / 2;

const CAM_CNT1: CameraState = { x: 590, y: 380, k: 1.28 };
const CAM_DIST: CameraState = { x: 930, y: 400, k: 1.25 };

// ---------------------------------------------------------------------------
// Timeline (~80s, nine beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const railU = tl.channel('railU', 0);
  const codeU = tl.channel('codeU', 0);
  const graphU = tl.channel('graphU', 0);
  const loadU = tl.channel('loadU', 0); // initial batch: edges stream + bars fill
  const newEdgeU = tl.channel('newEdgeU', 0); // B→D pops into the graph
  const sweepU = tl.channel('sweepU', 0); // batch strawman: re-read flash
  const timer1U = tl.channel('timer1U', 0); // "6 of 6 edges re-read"

  const h1 = tl.channel('h1', 0); // delta: edges → map
  const h2 = tl.channel('h2', 0); // map → count (as (B, +1))
  const cnt1Glow = tl.channel('cnt1Glow', 0);
  const degSwap = tl.channel('degSwap', 0); // B bar 1 → 2 (stepped by flash)
  const h3 = tl.channel('h3', 0); // two diffs: count → map
  const h4 = tl.channel('h4', 0); // two diffs: map → count
  const cnt2Glow = tl.channel('cnt2Glow', 0);
  const distSwap = tl.channel('distSwap', 0); // distribution 0 → 1
  const timer2U = tl.channel('timer2U', 0); // "1 key touched"

  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · the query as a dataflow —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'A differential query is a dataflow of operators. This one is real — straight from the project documentation: the out-degree distribution of a graph.',
  });
  tl.tween(railU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(codeU, 1, { at: 2.6, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 7.6,
    dur: 5.4,
    text: 'Extract the source of each edge, count occurrences per node, then count how many nodes share each count.',
  });

  // — beat 2 · initial load —
  tl.caption({
    at: 13.6,
    dur: 6.0,
    text: 'Load six edges and the whole thing runs once. Degrees per node on the left, the distribution of degrees on the right.',
  });
  tl.tween(graphU, 1, { at: 13.8, dur: 1.2, ease: ease.draw });
  tl.tween(loadU, 1, { at: 15.2, dur: 3.6, ease: ease.linear });

  // — beat 3 · one edge arrives; the batch instinct —
  tl.caption({
    at: 20.4,
    dur: 5.2,
    text: 'Then one new edge appears, from node B to node D. Just the one.',
  });
  tl.tween(newEdgeU, 1, { at: 21.4, dur: 0.6, ease: ease.pop });
  tl.caption({
    at: 26.2,
    dur: 6.2,
    text: 'The batch instinct is to run the query again: every edge re-read, every count rebuilt, to change two numbers.',
  });
  tl.tween(sweepU, 1, { at: 27.0, dur: 2.8, ease: ease.linear });
  tl.tween(timer1U, 1, { at: 30.0, dur: 0.5, ease: ease.pop });

  // — beat 4 · the differential answer: one delta —
  tl.caption({
    at: 33.2,
    dur: 5.8,
    text: 'Differential dataflow ships something smaller: the change itself. The new edge enters the rail as one difference — this edge, this time, plus one.',
  });
  tl.tween(timer1U, 0, { at: 33.4, dur: 0.5, ease: ease.enter });
  tl.tween(h1, 1, { at: 35.6, dur: 1.5, ease: ease.linear });

  // — beat 5 · map —
  tl.caption({
    at: 39.6,
    dur: 4.4,
    text: 'The map keeps only the source. The difference is now: node B, plus one.',
  });
  tl.tween(h2, 1, { at: 40.6, dur: 1.5, ease: ease.linear });

  // — beat 6 · the count: retract and assert —
  tl.caption({
    at: 44.6,
    dur: 7.2,
    text: 'Now the count — and here is the move that makes everything work. Node B held degree one; it now holds degree two. So the count ships two differences: retract the old answer, assert the new one.',
  });
  tl.tween(cam, CAM_CNT1, { at: 44.8, dur: 1.3, ease: ease.move });
  tl.tween(cnt1Glow, 1, { at: 45.6, dur: 0.3, ease: ease.enter });
  tl.tween(cnt1Glow, 0, { at: 46.4, dur: 0.6, ease: ease.enter });
  tl.set(degSwap, 1, 46.6);
  tl.tween(h3, 1, { at: 48.4, dur: 1.6, ease: ease.linear });
  tl.caption({
    at: 52.4,
    dur: 4.6,
    text: 'One update went in. Two came out. The output of an operator is a collection too — so its changes are differences as well.',
  });

  // — beat 7 · the second count —
  tl.caption({
    at: 57.6,
    dur: 6.8,
    text: 'Those two differences ride on. The final count restates only the rows they touch: one fewer node with degree one, one more with degree two. The distribution is current.',
  });
  tl.tween(cam, CAM_DIST, { at: 57.8, dur: 1.3, ease: ease.move });
  tl.tween(h4, 1, { at: 58.8, dur: 1.6, ease: ease.linear });
  tl.tween(cnt2Glow, 1, { at: 60.2, dur: 0.3, ease: ease.enter });
  tl.tween(cnt2Glow, 0, { at: 61.0, dur: 0.6, ease: ease.enter });
  tl.set(distSwap, 1, 61.2);

  // — beat 8 · the payoff —
  tl.caption({
    at: 65.2,
    dur: 6.4,
    text: 'Nodes A, C, D, and E slept through all of it. The work was proportional to the change — one edge — not to the size of the graph.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 65.4, dur: 1.4, ease: ease.move });
  tl.tween(timer2U, 1, { at: 67.0, dur: 0.5, ease: ease.pop });

  // — beat 9 · close —
  tl.caption({
    at: 72.4,
    dur: 6.6,
    text: 'Differences in, differences out. Because every operator speaks the same language of changes, they compose into whole programs that never recompute.',
  });
  tl.tween(dimU, 1, { at: 72.6, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 73.4, dur: 0.8, ease: ease.enter });
  tl.hold(79.2, 1.0);

  return {
    tl,
    cam,
    railU,
    codeU,
    graphU,
    loadU,
    newEdgeU,
    sweepU,
    timer1U,
    h1,
    h2,
    cnt1Glow,
    degSwap,
    h3,
    h4,
    cnt2Glow,
    distSwap,
    timer2U,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Chip({ x, y, text, tone, op = 1 }: { x: number; y: number; text: string; tone: string; op?: number }) {
  const w = Math.max(72, text.length * 8.2 + 22);
  return (
    <g opacity={op}>
      <rect x={x - w / 2} y={y - 15} width={w} height={30} rx={8} fill={colors.PANEL} stroke={tone} strokeWidth={1.5} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={tone} fontSize={12.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const railU = s.get(scene.railU);
  const codeU = s.get(scene.codeU);
  const graphU = s.get(scene.graphU);
  const loadU = s.get(scene.loadU);
  const newEdgeU = s.get(scene.newEdgeU);
  const sweepU = s.get(scene.sweepU);
  const timer1U = s.get(scene.timer1U);
  const h1 = s.get(scene.h1);
  const h2 = s.get(scene.h2);
  const cnt1Glow = s.get(scene.cnt1Glow);
  const degSwap = s.get(scene.degSwap);
  const h3 = s.get(scene.h3);
  const h4 = s.get(scene.h4);
  const cnt2Glow = s.get(scene.cnt2Glow);
  const distSwap = s.get(scene.distSwap);
  const timer2U = s.get(scene.timer2U);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const stageOp = 1 - 0.85 * dimU;
  const deg = degSwap > 0.5 ? DEG1 : DEG0;
  const dist = distSwap > 0.5 ? DIST1 : DIST0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageOp}>
          {/* ---------------- the rail ---------------- */}
          {railU > 0.01 && (
            <g>
              {STOPS.map((st, i) => {
                const u = win(railU, STOPS.length, i, 1.6);
                const glow = (i === 2 ? cnt1Glow : i === 4 ? cnt2Glow : 0) * 0.9;
                return (
                  <g key={st.key} opacity={u}>
                    {glow > 0 && (
                      <rect x={st.x - st.w / 2 - 6} y={RAIL_Y - STOP_H / 2 - 6} width={st.w + 12} height={STOP_H + 12} rx={14} fill={colors.WARM} opacity={0.25 * glow} />
                    )}
                    <rect x={st.x - st.w / 2} y={RAIL_Y - STOP_H / 2} width={st.w} height={STOP_H} rx={11} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
                    <text x={st.x} y={RAIL_Y - 3} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600}>
                      {st.label}
                    </text>
                    <text x={st.x} y={RAIL_Y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                      {st.sub}
                    </text>
                  </g>
                );
              })}
              {STOPS.slice(0, -1).map((st, i) => {
                const u = clamp01(railU * 1.4 - 0.3);
                const x0 = st.x + st.w / 2;
                const x1 = STOPS[i + 1].x - STOPS[i + 1].w / 2;
                return (
                  <line
                    key={i}
                    x1={x0}
                    y1={RAIL_Y}
                    x2={x0 + (x1 - x0) * u}
                    y2={RAIL_Y}
                    stroke={colors.GRID}
                    strokeWidth={2}
                    markerEnd={u > 0.95 ? 'url(#dd2-arrow)' : undefined}
                  />
                );
              })}
            </g>
          )}
          {codeU > 0.01 && (
            <g opacity={codeU}>
              <rect x={640 - 330} y={118} width={660} height={34} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={140} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
                {CODE}
              </text>
            </g>
          )}

          {/* ---------------- the graph ---------------- */}
          {graphU > 0.01 && (
            <g opacity={graphU}>
              {BASE_EDGES.map(([a, b], i) => {
                const p = NODE_POS[a];
                const q = NODE_POS[b];
                const flash = sweepU > 0 ? clamp01(1 - Math.abs(sweepU * (BASE_EDGES.length + 1) - (i + 1)) / 1) : 0;
                return (
                  <line
                    key={i}
                    x1={p.x}
                    y1={p.y}
                    x2={q.x}
                    y2={q.y}
                    stroke={flash > 0.2 ? colors.WARM : colors.GRID}
                    strokeWidth={flash > 0.2 ? 3 : 2}
                    markerEnd="url(#dd2-arrow-dim)"
                    opacity={0.5 + 0.5 * flash}
                  />
                );
              })}
              {newEdgeU > 0.01 && (
                <line
                  x1={NODE_POS.B.x}
                  y1={NODE_POS.B.y}
                  x2={lerp(NODE_POS.B.x, NODE_POS.D.x, clamp01(newEdgeU * 1.4))}
                  y2={lerp(NODE_POS.B.y, NODE_POS.D.y, clamp01(newEdgeU * 1.4))}
                  stroke={colors.WARM}
                  strokeWidth={3}
                  markerEnd={newEdgeU > 0.7 ? 'url(#dd2-arrow-warm)' : undefined}
                />
              )}
              {IDS.map((id) => (
                <g key={id}>
                  <circle cx={NODE_POS[id].x} cy={NODE_POS[id].y} r={19} fill={colors.PANEL} stroke={id === 'B' && newEdgeU > 0.3 ? colors.WARM : colors.GRID} strokeWidth={2} />
                  <text x={NODE_POS[id].x} y={NODE_POS[id].y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                    {id}
                  </text>
                </g>
              ))}
              <text x={GC.x} y={GC.y + GR + 42} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
                the graph
              </text>
              {timer1U > 0.01 && (
                <g opacity={timer1U}>
                  <rect x={GC.x - 104} y={GC.y - GR - 74} width={208} height={36} rx={9} fill={colors.BG} stroke={colors.NEGATIVE} />
                  <text x={GC.x} y={GC.y - GR - 51} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
                    batch: 6 of 6 edges re-read
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---------------- degree bars (per node) ---------------- */}
          {loadU > 0.01 && (
            <g>
              <text x={degBarX(2)} y={DEGB.y - 3 * DEGB.unit - 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                out-degree per node
              </text>
              <line x1={DEGB.x0 - 22} y1={DEGB.y} x2={DEGB.x0 + 5 * (DEGB.w + DEGB.gap) + 2} y2={DEGB.y} stroke={colors.GRID} strokeWidth={2} />
              {IDS.map((id, i) => {
                const u = win(loadU, 5, i, 2);
                const h = deg[id] * DEGB.unit * u;
                const hot = id === 'B' && degSwap > 0.5 && h3 < 0.9;
                return (
                  <g key={id} opacity={clamp01(u * 1.6)}>
                    <rect x={degBarX(i) - DEGB.w / 2} y={DEGB.y - h} width={DEGB.w} height={Math.max(0.001, h)} rx={5} fill={hot ? colors.WARM : colors.ACCENT} opacity={0.85} />
                    <text x={degBarX(i)} y={DEGB.y + 18} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                      {id}
                    </text>
                    <text x={degBarX(i)} y={DEGB.y - h - 7} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {deg[id]}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---------------- distribution bars (per degree) ---------------- */}
          {loadU > 0.3 && (
            <g opacity={clamp01((loadU - 0.3) * 2)}>
              <text x={distBarX(1.5)} y={DISTB.y - 3 * DISTB.unit - 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                nodes per degree
              </text>
              <line x1={DISTB.x0 - 22} y1={DISTB.y} x2={DISTB.x0 + 4 * (DISTB.w + DISTB.gap) + 2} y2={DISTB.y} stroke={colors.GRID} strokeWidth={2} />
              {dist.map((c, d) => {
                const h = c * DISTB.unit;
                const hot = distSwap > 0.5 && (d === 1 || d === 2) && cnt2Glow > 0.01;
                return (
                  <g key={d}>
                    <rect x={distBarX(d) - DISTB.w / 2} y={DISTB.y - h} width={DISTB.w} height={Math.max(0.001, h)} rx={5} fill={hot ? colors.WARM : colors.SECONDARY} opacity={0.85} />
                    <text x={distBarX(d)} y={DISTB.y + 18} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={MONO}>
                      deg {d}
                    </text>
                    <text x={distBarX(d)} y={DISTB.y - h - 7} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                      {c}
                    </text>
                  </g>
                );
              })}
              {timer2U > 0.01 && (
                <g opacity={timer2U}>
                  <rect x={distBarX(1.5) - 120} y={DISTB.y - 3 * DISTB.unit - 78} width={240} height={36} rx={9} fill={colors.BG} stroke={colors.POSITIVE} />
                  <text x={distBarX(1.5)} y={DISTB.y - 3 * DISTB.unit - 55} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
                    differential: 1 key touched
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---------------- the traveling differences ---------------- */}
          {h1 > 0.01 && h1 < 1 && (
            <Chip x={lerp(stopX(0) + 59, stopX(1) - 64, h1)} y={RAIL_Y - 44} text="((B,D), t, +1)" tone={colors.POSITIVE} />
          )}
          {h2 > 0.01 && h2 < 1 && (
            <Chip x={lerp(stopX(1) + 64, stopX(2) - 64, h2)} y={RAIL_Y - 44} text="(B, +1)" tone={colors.POSITIVE} />
          )}
          {h3 > 0.01 && h3 < 1 && (
            <>
              <Chip x={lerp(stopX(2) + 64, stopX(3) - 64, h3)} y={RAIL_Y - 58} text="((B,1), −1)" tone={colors.NEGATIVE} />
              <Chip x={lerp(stopX(2) + 64, stopX(3) - 64, clamp01(h3 * 1.12 - 0.12))} y={RAIL_Y - 24} text="((B,2), +1)" tone={colors.POSITIVE} />
            </>
          )}
          {h4 > 0.01 && h4 < 1 && (
            <>
              <Chip x={lerp(stopX(3) + 64, stopX(4) - 64, h4)} y={RAIL_Y - 58} text="(1, −1)" tone={colors.NEGATIVE} />
              <Chip x={lerp(stopX(3) + 64, stopX(4) - 64, clamp01(h4 * 1.12 - 0.12))} y={RAIL_Y - 24} text="(2, +1)" tone={colors.POSITIVE} />
            </>
          )}
        </g>

        {/* ---------------- closing panel ---------------- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={250} y={256} width={780} height={182} rx={16} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={322} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={650}>
              Differences in, differences out.
            </text>
            <text x={640} y={362} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
              one edge changed → two diffs → four diffs — never the whole graph
            </text>
            <text x={640} y={402} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              map · count · map · count
            </text>
          </g>
        )}
      </Camera>
      <defs>
        <marker id="dd2-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.GRID} />
        </marker>
        <marker id="dd2-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.GRID} />
        </marker>
        <marker id="dd2-arrow-warm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={colors.WARM} />
        </marker>
      </defs>
    </>
  );
}

export const vizScene = () => scene;
