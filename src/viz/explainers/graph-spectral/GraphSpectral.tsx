import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  BAR,
  EDGES,
  FIEDLER,
  LAMBDA2,
  LAP_DISP,
  LIFT,
  MAT,
  MC,
  MG,
  MP,
  N,
  ORDER,
  POS,
  buildScene,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const MAT_W = N * MP - MG;
const FLAT_LIFT = -60;

function renderFrame(s: SceneState) {
  const graphU = s.get(scene.graphU);
  const matU = s.get(scene.matU);
  const flatU = s.get(scene.flatU);
  const modeU = s.get(scene.modeU);
  const signU = s.get(scene.signU);
  const fenceU = s.get(scene.fenceU);
  const lamU = s.get(scene.lamU);
  const barU = s.get(scene.barU);
  const closeU = s.get(scene.closeU);

  // node display position: graph layout → mode displacement → 1-D embedding
  const nodeXY = (i: number) => {
    const dispY = POS[i].y + flatU * FLAT_LIFT - modeU * FIEDLER[i] * LIFT * (1 - barU);
    const rank = ORDER.indexOf(i);
    return {
      x: lerp(POS[i].x, BAR.x0 + rank * BAR.dx, barU),
      y: lerp(dispY, BAR.y - 40, barU),
    };
  };

  const nodeColor = (i: number) => {
    if (signU < 0.02) return colors.MUTED;
    return FIEDLER[i] < 0 ? colors.NEGATIVE : colors.ACCENT;
  };

  return (
    <Camera {...s.get(scene.cam)}>
      {/* edges follow the nodes everywhere */}
      {EDGES.map(([a, b], k) => {
        const pa = nodeXY(a);
        const pb = nodeXY(b);
        return (
          <line
            key={k}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={colors.MUTED}
            strokeWidth={1.8}
            opacity={0.5 * clamp01(graphU * EDGES.length - k) * (1 - 0.5 * barU)}
          />
        );
      })}

      {/* zero line during the mode beat */}
      {modeU > 0.02 && barU < 0.98 && (
        <line
          x1={200}
          y1={345}
          x2={1080}
          y2={345}
          stroke={colors.GRID}
          strokeWidth={1.5}
          strokeDasharray="6 8"
          opacity={modeU * (1 - barU)}
        />
      )}

      {/* nodes */}
      {POS.map((_, i) => {
        const u = clamp01(graphU * N - i * 0.5);
        const p = nodeXY(i);
        const isFence = i === 4 || i === 5;
        return (
          <g key={i} opacity={u}>
            <circle
              cx={p.x}
              cy={p.y}
              r={14}
              fill={colors.PANEL}
              stroke={isFence && fenceU > 0.02 ? colors.WARM : nodeColor(i)}
              strokeWidth={isFence ? 2 + 2 * fenceU : 2.5}
            />
            <text x={p.x} y={p.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
              {i}
            </text>
            {/* Fiedler value chip during the sign beat */}
            <g opacity={Math.max(signU * modeU * (1 - barU), barU)}>
              <text x={p.x} y={p.y - 22} textAnchor="middle" fill={nodeColor(i)} fontSize={12}>
                {FIEDLER[i].toFixed(2)}
              </text>
            </g>
          </g>
        );
      })}

      {/* ── the Laplacian matrix ── */}
      <text x={MAT.x + MAT_W / 2} y={MAT.y - 30} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={clamp01(matU * 8)}>
        Laplacian · degree on the diagonal, −1 per edge
      </text>
      <MatrixGrid
        x={MAT.x}
        y={MAT.y}
        values={LAP_DISP}
        cell={MC}
        gap={MG}
        cellU={(i, j) => clamp01(matU * 100 - (i * 10 + j))}
        emphasize={2}
        opacity={1 - 0.7 * barU}
      />

      {/* λ₂ chip */}
      <g opacity={lamU}>
        <rect x={480} y={90} width={320} height={44} rx={10} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={640} y={118} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
          algebraic connectivity λ₂ = {LAMBDA2.toFixed(2)}
        </text>
      </g>

      {/* embedding axis */}
      <g opacity={barU}>
        <line x1={BAR.x0 - 40} y1={BAR.y} x2={BAR.x0 + 9 * BAR.dx + 40} y2={BAR.y} stroke={colors.GRID} strokeWidth={1.5} />
        <text x={BAR.x0 + 4.5 * BAR.dx} y={BAR.y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          nodes ordered by eigenvector value — cut at zero
        </text>
      </g>

      {/* closing */}
      <MathLabel
        tex="A \;\to\; \text{messages} \;\to\; \text{tasks} \;\to\; \text{spectrum}"
        x={640}
        y={70}
        fontSize={21}
        color={colors.TEXT}
        opacity={closeU}
      />
    </Camera>
  );
}

export function GraphSpectral() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/graph-spectral/overrides.json', slug: 'graph-spectral' }}
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
