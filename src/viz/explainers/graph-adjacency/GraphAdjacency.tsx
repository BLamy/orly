import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import { ADJ, BRIDGE, DEG, EDGES, MAT, MC, MG, MP, N, POS, buildScene } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MAT_W = N * MP - MG;
const commColor = (i: number) => (i < 5 ? colors.ACCENT : colors.SECONDARY);

function renderFrame(s: SceneState) {
  const nodeP = s.get(scene.nodeP);
  const edgeP = s.get(scene.edgeP);
  const matU = s.get(scene.matU);
  const bridgeU = s.get(scene.bridgeU);
  const degU = s.get(scene.degU);
  const blockU = s.get(scene.blockU);
  const sparseU = s.get(scene.sparseU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── edges ── */}
      {EDGES.map(([a, b], k) => {
        const u = clamp01(edgeP * EDGES.length - k);
        const isBridge = a === BRIDGE[0] && b === BRIDGE[1];
        const x2 = POS[a].x + (POS[b].x - POS[a].x) * u;
        const y2 = POS[a].y + (POS[b].y - POS[a].y) * u;
        return (
          <line
            key={k}
            x1={POS[a].x}
            y1={POS[a].y}
            x2={x2}
            y2={y2}
            stroke={isBridge ? (bridgeU > 0.02 ? colors.WARM : colors.MUTED) : colors.MUTED}
            strokeWidth={isBridge ? 2 + 2.5 * bridgeU : 2}
            opacity={0.55 + 0.45 * (isBridge ? bridgeU : 0)}
          />
        );
      })}

      {/* ── nodes ── */}
      {POS.map((p, i) => {
        const u = clamp01(nodeP * N - i * 0.6);
        const r = (14 + 2.5 * degU * (DEG[i] - 3)) * u;
        return (
          <g key={i} opacity={u}>
            <circle cx={p.x} cy={p.y} r={Math.max(2, r)} fill={colors.PANEL} stroke={commColor(i)} strokeWidth={2.5} />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="ui-monospace, Menlo, monospace">
              {i}
            </text>
            {/* degree chip */}
            <g opacity={degU}>
              <text x={p.x + 22} y={p.y - 12} fill={colors.WARM} fontSize={13}>
                d={DEG[i]}
              </text>
            </g>
          </g>
        );
      })}

      {/* community labels at the close */}
      <g opacity={closeU}>
        <text x={260} y={560} textAnchor="middle" fill={colors.ACCENT} fontSize={16}>
          community A
        </text>
        <text x={760} y={560} textAnchor="middle" fill={colors.SECONDARY} fontSize={16}>
          community B
        </text>
        <text x={485} y={415} textAnchor="middle" fill={colors.WARM} fontSize={14}>
          the bridge
        </text>
      </g>

      {/* ── adjacency matrix ── */}
      <text x={MAT.x + MAT_W / 2} y={MAT.y - 40} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(matU * 8)}>
        adjacency · 10×10
      </text>
      <MatrixGrid
        x={MAT.x}
        y={MAT.y}
        values={ADJ}
        cell={MC}
        gap={MG}
        cellU={(i, j) => clamp01(matU * 100 - (i * 10 + j))}
        emphasize={2}
        rowLabels={POS.map((_, i) => String(i))}
        colLabels={POS.map((_, i) => String(i))}
        labelSize={11}
      />
      {/* bridge cells */}
      <g opacity={bridgeU}>
        {[
          [BRIDGE[0], BRIDGE[1]],
          [BRIDGE[1], BRIDGE[0]],
        ].map(([i, j]) => (
          <rect key={`${i}${j}`} x={MAT.x + j * MP - 2} y={MAT.y + i * MP - 2} width={MC + 4} height={MC + 4} rx={5} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
        ))}
      </g>
      {/* community blocks */}
      <g opacity={blockU}>
        <rect x={MAT.x - 3} y={MAT.y - 3} width={5 * MP + 3} height={5 * MP + 3} rx={8} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
        <rect x={MAT.x + 5 * MP - 3} y={MAT.y + 5 * MP - 3} width={5 * MP + 3} height={5 * MP + 3} rx={8} fill="none" stroke={colors.SECONDARY} strokeWidth={2} />
        <rect x={MAT.x + 5 * MP - 2} y={MAT.y + 4 * MP - 2} width={MC + 4} height={MC + 4} rx={5} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
      </g>
      {/* sparsity note */}
      <g opacity={sparseU}>
        <rect x={MAT.x + 20} y={MAT.y + MAT_W + 24} width={MAT_W - 40} height={40} rx={10} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
        <text x={MAT.x + MAT_W / 2} y={MAT.y + MAT_W + 50} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
          15 edges of 45 possible
        </text>
      </g>
    </Camera>
  );
}

export function GraphAdjacency() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/graph-adjacency/overrides.json', slug: 'graph-adjacency' }}
      >
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
