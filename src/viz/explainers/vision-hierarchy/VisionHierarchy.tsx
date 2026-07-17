import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  CC,
  CG,
  COR_N,
  COR_XY,
  CORNER,
  CORNER_RAW,
  CP,
  EC,
  EDGE_N,
  EG,
  EP,
  IC,
  IG,
  IMAGE,
  IMG_N,
  IMG_XY,
  IP,
  MAP_VX,
  MAP_VY,
  SC,
  SG,
  SHAPE,
  SHAPE_N,
  SHAPE_XY,
  SP,
  VX_XY,
  VY_XY,
  buildScene,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpGrid = (A: number[][], B: number[][], u: number) =>
  u <= 0 ? A : u >= 1 ? B : A.map((r, i) => r.map((v, j) => lerp(v, B[i][j], u)));

const IMG_W = IMG_N * IP - IG;
const EDGE_W = EDGE_N * EP - EG;
const COR_W = COR_N * CP - CG;
const SHAPE_W = SHAPE_N * SP - SG;

const STAGE_LABELS: Array<{ x: number; y: number; w: number; text: string }> = [
  { x: IMG_XY.x, y: IMG_XY.y + IMG_W, w: IMG_W, text: 'pixels' },
  { x: VX_XY.x, y: VY_XY.y + EDGE_W, w: EDGE_W, text: 'edges' },
  { x: COR_XY.x, y: COR_XY.y + COR_W, w: COR_W, text: 'corners' },
  { x: SHAPE_XY.x, y: SHAPE_XY.y + SHAPE_W, w: SHAPE_W, text: 'shape' },
];

function flowLine(x1: number, y1: number, x2: number, y2: number, op: number, key: string) {
  return (
    <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.GRID} strokeWidth={1.5} opacity={op} />
  );
}

function renderFrame(s: SceneState) {
  const imgU = s.get(scene.imgU);
  const vxU = s.get(scene.vxU);
  const vyU = s.get(scene.vyU);
  const corU = s.get(scene.corU);
  const reluU = s.get(scene.reluU);
  const winU = s.get(scene.winU);
  const shapeU = s.get(scene.shapeU);
  const ladderU = s.get(scene.ladderU);
  const dimU = s.get(scene.dimU);

  const corner = lerpGrid(CORNER_RAW, CORNER, reluU);
  const mainOp = 1 - 0.65 * dimU;

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOp}>
        {/* ── the image ── */}
        <text x={IMG_XY.x + IMG_W / 2} y={IMG_XY.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(imgU * 8)}>
          image · 14×14
        </text>
        <MatrixGrid
          x={IMG_XY.x}
          y={IMG_XY.y}
          values={IMAGE}
          cell={IC}
          gap={IG}
          cellU={(i, j) => clamp01(imgU * IMG_N * IMG_N - (i * IMG_N + j))}
          emphasize={2}
        />

        {/* ── layer 1: two edge maps ── */}
        {flowLine(IMG_XY.x + IMG_W + 8, IMG_XY.y + IMG_W / 2, VX_XY.x - 8, VX_XY.y + EDGE_W / 2, vxU, 'f1')}
        {flowLine(IMG_XY.x + IMG_W + 8, IMG_XY.y + IMG_W / 2, VY_XY.x - 8, VY_XY.y + EDGE_W / 2, vyU, 'f2')}
        <text x={VX_XY.x + EDGE_W / 2} y={VX_XY.y - 10} textAnchor="middle" fill={colors.ACCENT} fontSize={12} opacity={clamp01(vxU * 8)}>
          vertical edges
        </text>
        <MatrixGrid
          x={VX_XY.x}
          y={VX_XY.y}
          values={MAP_VX}
          cell={EC}
          gap={EG}
          cellU={(i, j) => clamp01(vxU * EDGE_N * EDGE_N - (i * EDGE_N + j))}
          emphasize={2}
        />
        <text x={VY_XY.x + EDGE_W / 2} y={VY_XY.y - 10} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} opacity={clamp01(vyU * 8)}>
          horizontal edges
        </text>
        <MatrixGrid
          x={VY_XY.x}
          y={VY_XY.y}
          values={MAP_VY}
          cell={EC}
          gap={EG}
          cellU={(i, j) => clamp01(vyU * EDGE_N * EDGE_N - (i * EDGE_N + j))}
          emphasize={2}
        />

        {/* conjunction window demo: same window on both maps → one corner cell */}
        <g opacity={winU}>
          <rect x={VX_XY.x - 2} y={VX_XY.y - 2} width={3 * EP + 3} height={3 * EP + 3} rx={5} fill={colors.WARM} fillOpacity={0.12} stroke={colors.WARM} strokeWidth={2} />
          <rect x={VY_XY.x - 2} y={VY_XY.y - 2} width={3 * EP + 3} height={3 * EP + 3} rx={5} fill={colors.WARM} fillOpacity={0.12} stroke={colors.WARM} strokeWidth={2} />
          <line x1={VX_XY.x + 3 * EP + 4} y1={VX_XY.y + 1.5 * EP} x2={COR_XY.x + CP + 2} y2={COR_XY.y + CP + CC / 2} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="3 6" />
          <line x1={VY_XY.x + 3 * EP + 4} y1={VY_XY.y + 1.5 * EP} x2={COR_XY.x + CP + 2} y2={COR_XY.y + CP + CC / 2} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="3 6" />
          <text x={COR_XY.x - 26} y={COR_XY.y - 34} textAnchor="middle" fill={colors.WARM} fontSize={13}>
            both fire → corner
          </text>
        </g>

        {/* ── layer 2: the corner map ── */}
        {flowLine(VX_XY.x + EDGE_W + 8, VX_XY.y + EDGE_W / 2, COR_XY.x - 8, COR_XY.y + COR_W / 2, corU, 'f3')}
        {flowLine(VY_XY.x + EDGE_W + 8, VY_XY.y + EDGE_W / 2, COR_XY.x - 8, COR_XY.y + COR_W / 2, corU, 'f4')}
        <text x={COR_XY.x + COR_W / 2} y={COR_XY.y - 14} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={clamp01(corU * 8)}>
          corner map · 10×10
        </text>
        <MatrixGrid
          x={COR_XY.x}
          y={COR_XY.y}
          values={corner}
          cell={CC}
          gap={CG}
          cellU={(i, j) => clamp01(corU * COR_N * COR_N - (i * COR_N + j))}
          emphasize={2}
        />

        {/* ── layer 3: the shape map ── */}
        {flowLine(COR_XY.x + COR_W + 8, COR_XY.y + COR_W / 2, SHAPE_XY.x - 8, SHAPE_XY.y + SHAPE_W / 2, shapeU, 'f5')}
        <text x={SHAPE_XY.x + SHAPE_W / 2} y={SHAPE_XY.y - 14} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} opacity={clamp01(shapeU * 8)}>
          square detector · 3×3
        </text>
        <MatrixGrid
          x={SHAPE_XY.x}
          y={SHAPE_XY.y}
          values={SHAPE}
          cell={SC}
          gap={SG}
          cellU={(i, j) => clamp01(shapeU * 9 - (i * 3 + j))}
          emphasize={2}
          showValues={(v) => v.toFixed(2)}
          labelSize={14}
        />

        {/* the ladder labels */}
        <g opacity={ladderU}>
          {STAGE_LABELS.map((l) => (
            <text key={l.text} x={l.x + l.w / 2} y={l.y + 26} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
              {l.text}
            </text>
          ))}
        </g>
      </g>

      {/* closing line over the dimmed stage */}
      <MathLabel
        tex="\text{pixels} \to \text{edges} \to \text{corners} \to \text{shape}"
        x={640}
        y={90}
        fontSize={24}
        color={colors.TEXT}
        opacity={dimU}
      />
    </Camera>
  );
}

export function VisionHierarchy() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/vision-hierarchy/overrides.json', slug: 'vision-hierarchy' }}
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
