// Search the Claim, Keep the Source — chapter 4: Follow the Evidence.
//
// Grounded in AskChem src/askchem/models.py ClaimEdge and edge sets,
// src/pilot_edges.py, src/grade_edges.py, src/askchem/db.py neighborhood APIs,
// src/askchem/server.py, src/askchem/mcp_server.py, and arXiv:2607.28618.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const NODES = [
  { x: 640, y: 330, label: 'claim A', doi: '10.a', color: colors.WARM },
  { x: 430, y: 195, label: 'claim B', doi: '10.b', color: colors.ACCENT },
  { x: 820, y: 165, label: 'claim C', doi: '10.c', color: colors.SECONDARY },
  { x: 930, y: 380, label: 'claim D', doi: '10.d', color: colors.NEGATIVE },
  { x: 760, y: 535, label: 'claim E', doi: '10.e', color: colors.POSITIVE },
  { x: 445, y: 505, label: 'claim F', doi: '10.f', color: colors.TEAL },
];
const EDGES = [
  { from: 1, to: 0, label: 'supports', color: colors.POSITIVE },
  { from: 2, to: 0, label: 'derives_from', color: colors.ACCENT },
  { from: 0, to: 4, label: 'extends', color: colors.SECONDARY },
  { from: 3, to: 0, label: 'contradicts', color: colors.NEGATIVE },
  { from: 5, to: 0, label: 'cites_as_evidence', color: colors.WARM },
];
const PORTALS = [
  { x: 170, y: 205, label: 'WEB', sub: '/api/search', color: colors.ACCENT },
  { x: 170, y: 320, label: 'REST', sub: '/api/claims/{id}', color: colors.SECONDARY },
  { x: 170, y: 435, label: 'PYTHON SDK', sub: 'AskChem.search', color: colors.POSITIVE },
  { x: 170, y: 550, label: 'MCP', sub: 'askchem_search', color: colors.WARM },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const graphU = tl.channel('graphU', 0);
  const intraU = tl.channel('intraU', 0);
  const crossU = tl.channel('crossU', 0);
  const contradictionU = tl.channel('contradictionU', 0);
  const portalU = tl.channel('portalU', 0);
  const accessU = tl.channel('accessU', 0);
  const pulseU = tl.channel('pulseU', 0);
  const sourceU = tl.channel('sourceU', 0);
  const retraceU = tl.channel('retraceU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'A ranked claim can answer one question, but literature synthesis also depends on how findings relate to one another.' });
  tl.tween(graphU, 1, { at: 0.9, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 660, y: 350, k: 1.08 }, { at: 1.4, dur: 1.3, ease: ease.move });
  tl.hold(6.2, 0.6);

  tl.caption({ at: 6.8, dur: 5.8, text: 'Within a paper, typed edges can say that one claim supports another or that a result derives from earlier evidence.' });
  tl.tween(intraU, 1, { at: 7.3, dur: 1.8, ease: ease.draw });
  tl.hold(12.6, 0.6);

  tl.caption({ at: 13.2, dur: 6.0, text: 'Across papers, other edges can mark extensions, contradictions, and findings that cite one another as evidence.' });
  tl.tween(crossU, 1, { at: 13.7, dur: 2.0, ease: ease.draw });
  tl.hold(19.2, 0.6);

  tl.caption({ at: 19.8, dur: 5.8, text: 'A contradiction stays visible as a relationship between two sourced claims instead of being flattened into one confident sentence.' });
  tl.tween(contradictionU, 1, { at: 20.3, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 790, y: 335, k: 1.18 }, { at: 20.8, dur: 1.3, ease: ease.move });
  tl.hold(25.6, 0.6);

  tl.caption({ at: 26.2, dur: 5.8, text: 'The same claim store is available through the web, a programming interface, a Python library, and the model context protocol.' });
  tl.tween(portalU, 1, { at: 26.7, dur: 1.3, ease: ease.enter });
  tl.tween(accessU, 1, { at: 27.7, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 28.2, dur: 1.3, ease: ease.move });
  tl.hold(32.0, 0.6);

  tl.caption({ at: 32.6, dur: 5.9, text: 'An agent can search for claims, inspect one claim in full, browse a view, or follow a source identifier back to every claim from that paper.' });
  tl.tween(pulseU, 1, { at: 33.1, dur: 2.8, ease: ease.linear });
  tl.tween(sourceU, 1, { at: 35.3, dur: 1.0, ease: ease.enter });
  tl.hold(38.5, 0.6);

  tl.caption({ at: 39.1, dur: 6.1, text: 'Now retrace the route: query, fused ranking, typed claim, evidence neighborhood, and finally the original source.' });
  tl.tween(retraceU, 1, { at: 39.6, dur: 3.5, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 365, k: 1.05 }, { at: 40.4, dur: 1.3, ease: ease.move });
  tl.hold(45.2, 0.6);

  tl.caption({ at: 45.8, dur: 6.2, text: 'That is the Ask Chem promise: search the claim, compare the evidence, and keep the source close enough to verify.' });
  tl.tween(dimU, 1, { at: 46.3, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 47.1, dur: 0.7, ease: ease.enter });
  tl.hold(52.0, 1.0);

  return { tl, cam, graphU, intraU, crossU, contradictionU, portalU, accessU, pulseU, sourceU, retraceU, dimU, endU };
}

const scene = buildScene();

function edgePoint(from: typeof NODES[number], to: typeof NODES[number], u: number) {
  return { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
}

function ClaimNode({ node, u, glow = 0 }: { node: typeof NODES[number]; u: number; glow?: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${node.x} ${node.y}) scale(${0.82 + uu * 0.18 + glow * 0.08})`}>
    <circle r={44 + glow * 4} fill={colors.PANEL} stroke={node.color} strokeWidth={2.5 + glow * 2} />
    <text y={-4} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontWeight={750}>{node.label}</text>
    <text y={16} textAnchor="middle" fill={node.color} fontSize={10} fontFamily={MONO}>{node.doi}</text>
  </g>;
}

function GraphEdge({ edge, u, glow = 0 }: { edge: typeof EDGES[number]; u: number; glow?: number }) {
  const uu = clamp01(u);
  const from = NODES[edge.from];
  const to = NODES[edge.to];
  const p = edgePoint(from, to, uu);
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  return <g opacity={uu}>
    <line x1={from.x} y1={from.y} x2={p.x} y2={p.y} stroke={edge.color} strokeWidth={2.2 + glow * 2} />
    <circle cx={p.x} cy={p.y} r={5 + glow * 3} fill={edge.color} />
    {uu > 0.75 && <g opacity={clamp01((uu - 0.75) * 4)}>
      <rect x={mx - 67} y={my - 14} width={134} height={28} rx={9} fill={colors.PANEL} stroke={edge.color} />
      <text x={mx} y={my + 4} textAnchor="middle" fill={edge.color} fontSize={10} fontFamily={MONO}>{edge.label}</text>
    </g>}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const graphU = s.get(scene.graphU);
  const intraU = s.get(scene.intraU);
  const crossU = s.get(scene.crossU);
  const contradictionU = s.get(scene.contradictionU);
  const accessU = s.get(scene.accessU);
  const pulseU = s.get(scene.pulseU);
  const retraceU = s.get(scene.retraceU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  const graphShift = s.get(scene.portalU) * 180;
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={780} opacity={mainOpacity}>Follow the evidence</text>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity}>
        <g transform={`translate(${graphShift} 0)`}>
          <GraphEdge edge={EDGES[0]} u={intraU} />
          <GraphEdge edge={EDGES[1]} u={intraU} />
          <GraphEdge edge={EDGES[2]} u={crossU} />
          <GraphEdge edge={EDGES[3]} u={crossU} glow={contradictionU} />
          <GraphEdge edge={EDGES[4]} u={crossU} />
          {NODES.map((n, i) => <ClaimNode key={n.label} node={{ ...n, x: n.x }} u={clamp01(graphU * 6 - i)} glow={i === 3 ? contradictionU : i === 0 ? clamp01(pulseU * 4 - 2) : 0} />)}
          {s.get(scene.sourceU) > 0 && <g opacity={s.get(scene.sourceU)}>
            <path d="M820 535 C860 585 975 560 1010 605" fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
            <rect x={865} y={576} width={290} height={48} rx={15} fill={colors.PANEL} stroke={colors.POSITIVE} />
            <text x={1010} y={606} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>askchem_source(doi)</text>
          </g>}
        </g>
        {s.get(scene.portalU) > 0 && <g opacity={s.get(scene.portalU)}>
          {PORTALS.map((p, i) => <g key={p.label}>
            <rect x={p.x - 94} y={p.y - 32} width={188} height={64} rx={16} fill={colors.PANEL} stroke={p.color} strokeWidth={2} />
            <text x={p.x} y={p.y - 5} textAnchor="middle" fill={p.color} fontSize={12} fontWeight={800} fontFamily={MONO}>{p.label}</text>
            <text x={p.x} y={p.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>{p.sub}</text>
            <path d={`M${p.x + 94} ${p.y} C340 ${p.y} 360 ${330 + graphShift} ${460 + graphShift} 330`} fill="none" stroke={p.color} strokeWidth={2} opacity={accessU} strokeDasharray="7 7" />
          </g>)}
          {pulseU > 0 && (() => {
            const p = edgePoint({ x: 264, y: 550 } as typeof NODES[number], { x: 640 + graphShift, y: 330 } as typeof NODES[number], pulseU);
            return <circle cx={p.x} cy={p.y} r={9} fill={colors.WARM} />;
          })()}
        </g>}
        {retraceU > 0 && <g opacity={retraceU}>
          {['query', 'rank fusion', 'claim', 'evidence graph', 'source'].map((label, i) => {
            const x = 165 + i * 235;
            const active = clamp01(retraceU * 6 - i);
            return <g key={label}>
              {i > 0 && <line x1={x - 185} y1={590} x2={x - 55} y2={590} stroke={colors.WARM} strokeWidth={3} opacity={active} />}
              <rect x={x - 55} y={570} width={110} height={40} rx={12} fill={colors.PANEL} stroke={active > 0.4 ? colors.WARM : colors.GRID} />
              <text x={x} y={595} textAnchor="middle" fill={active > 0.4 ? colors.TEXT : colors.MUTED} fontSize={10} fontFamily={MONO}>{label}</text>
            </g>;
          })}
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={165} y={216} width={950} height={240} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
      <text x={640} y={293} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={830}>Search the claim</text>
      <text x={640} y={344} textAnchor="middle" fill={colors.WARM} fontSize={25}>Keep the source</text>
      <text x={640} y={397} textAnchor="middle" fill={colors.MUTED} fontSize={14}>retrieve · relate · inspect · verify</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
