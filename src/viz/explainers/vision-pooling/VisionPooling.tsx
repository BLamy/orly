import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  ICELL,
  IGAP,
  IMAGE_A,
  IMAGE_B,
  IMG,
  IPITCH,
  MAPL,
  MAP_A,
  MAP_B,
  OUT_N,
  PCELL,
  PGAP,
  POOL,
  POOL_A,
  POOL_B,
  POOL_N,
  PPITCH,
  buildScene,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpGrid = (A: number[][], B: number[][], u: number) =>
  u <= 0 ? A : u >= 1 ? B : A.map((r, i) => r.map((v, j) => lerp(v, B[i][j], u)));

/** map cells that change under the one-pixel shift (for the diff outlines) */
const DIFF_CELLS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < OUT_N; i++)
    for (let j = 0; j < OUT_N; j++) if (Math.abs(MAP_A[i][j] - MAP_B[i][j]) > 1e-9) out.push([i, j]);
  return out;
})();

const MPITCH = ICELL + IGAP;
const MAP_W = OUT_N * MPITCH - IGAP;
const IMG_W = 12 * IPITCH - IGAP;
const POOL_W = POOL_N * PPITCH - PGAP;

function renderFrame(s: SceneState) {
  const imgU = s.get(scene.imgU);
  const mapU = s.get(scene.mapU);
  const poolP = s.get(scene.poolP);
  const shiftU = s.get(scene.shiftU);
  const diffU = s.get(scene.diffU);
  const panelU = s.get(scene.panelU);
  const fieldU = s.get(scene.fieldU);
  const closeU = s.get(scene.closeU);

  const image = lerpGrid(IMAGE_A, IMAGE_B, shiftU);
  const map = lerpGrid(MAP_A, MAP_B, shiftU);
  const pool = lerpGrid(POOL_A, POOL_B, shiftU);

  // pooling sweep: row-major over the 5×5 output
  const pos = Math.min(POOL_N * POOL_N - 1, Math.floor(poolP * POOL_N * POOL_N));
  const pi = Math.floor(pos / POOL_N);
  const pj = pos % POOL_N;
  const winOp = clamp01(Math.min(poolP * 30, (1 - poolP) * 30));

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── image ── */}
      <text x={IMG.x + IMG_W / 2} y={IMG.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(imgU * 8)}>
        image · 12×12
      </text>
      <MatrixGrid
        x={IMG.x}
        y={IMG.y}
        values={image}
        cell={ICELL}
        gap={IGAP}
        cellU={(i, j) => clamp01(imgU * 144 - (i * 12 + j))}
        emphasize={2}
      />

      {/* ── feature map ── */}
      <text x={MAPL.x + MAP_W / 2} y={MAPL.y - 16} textAnchor="middle" fill={colors.ACCENT} fontSize={14} opacity={clamp01(mapU * 8)}>
        edge map · 10×10
      </text>
      <MatrixGrid
        x={MAPL.x}
        y={MAPL.y}
        values={map}
        cell={ICELL}
        gap={IGAP}
        cellU={(i, j) => clamp01(mapU * 100 - (i * 10 + j))}
        emphasize={2}
      />
      {/* diff outlines on the map */}
      <g opacity={diffU}>
        {DIFF_CELLS.map(([i, j]) => (
          <rect
            key={`${i}-${j}`}
            x={MAPL.x + j * MPITCH - 1.5}
            y={MAPL.y + i * MPITCH - 1.5}
            width={ICELL + 3}
            height={ICELL + 3}
            rx={4}
            fill="none"
            stroke={colors.NEGATIVE}
            strokeWidth={2}
          />
        ))}
      </g>

      {/* ── pooled map ── */}
      <text x={POOL.x + POOL_W / 2} y={POOL.y - 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} opacity={winOp > 0 || poolP >= 1 ? 1 : clamp01(poolP * 8)}>
        max pooled · 5×5
      </text>
      <MatrixGrid
        x={POOL.x}
        y={POOL.y}
        values={pool}
        cell={PCELL}
        gap={PGAP}
        cellU={(i, j) => clamp01(poolP * 25 - (i * 5 + j))}
        emphasize={2}
        showValues={(v) => v.toFixed(2)}
        labelSize={13}
      />
      {/* unchanged badge on the pooled map */}
      <g opacity={diffU}>
        <rect x={POOL.x - 7} y={POOL.y - 7} width={POOL_W + 14} height={POOL_W + 14} rx={10} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
      </g>

      {/* pooling sweep window */}
      {winOp > 0.002 && (
        <g opacity={winOp}>
          <rect
            x={MAPL.x + 2 * pj * MPITCH - 2}
            y={MAPL.y + 2 * pi * MPITCH - 2}
            width={2 * MPITCH - IGAP + 4}
            height={2 * MPITCH - IGAP + 4}
            rx={6}
            fill={colors.WARM}
            fillOpacity={0.12}
            stroke={colors.WARM}
            strokeWidth={2.5}
          />
          <line
            x1={MAPL.x + 2 * pj * MPITCH + 2 * MPITCH}
            y1={MAPL.y + 2 * pi * MPITCH + MPITCH - 1}
            x2={POOL.x + pj * PPITCH - 4}
            y2={POOL.y + pi * PPITCH + PCELL / 2}
            stroke={colors.MUTED}
            strokeWidth={1.5}
            strokeDasharray="3 7"
            opacity={0.8}
          />
          <rect
            x={POOL.x + pj * PPITCH - 2}
            y={POOL.y + pi * PPITCH - 2}
            width={PCELL + 4}
            height={PCELL + 4}
            rx={6}
            fill="none"
            stroke={colors.WARM}
            strokeWidth={2.5}
          />
        </g>
      )}

      {/* the changed-cell scoreboard */}
      <g opacity={panelU}>
        <rect x={452} y={520} width={520} height={78} rx={12} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
        <text x={472} y={552} fill={colors.NEGATIVE} fontSize={17}>
          feature map: 10 / 100 cells changed
        </text>
        <text x={472} y={582} fill={colors.POSITIVE} fontSize={17}>
          pooled map: 0 / 25 cells changed
        </text>
      </g>

      {/* receptive-field cone: one pooled cell ← a wide image patch */}
      <g opacity={fieldU}>
        <polygon
          points={`${IMG.x + 0.5 * IPITCH},${IMG.y + 1 * IPITCH} ${IMG.x + 6.5 * IPITCH},${IMG.y + 1 * IPITCH} ${POOL.x + 1 * PPITCH + PCELL / 2},${POOL.y + PPITCH / 2} ${IMG.x + 0.5 * IPITCH},${IMG.y + 7 * IPITCH}`}
          fill={colors.SECONDARY}
          fillOpacity={0.1}
          stroke={colors.SECONDARY}
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        <rect
          x={IMG.x + 0.5 * IPITCH - 6}
          y={IMG.y + 1 * IPITCH - 6}
          width={6 * IPITCH + 12}
          height={6 * IPITCH + 12}
          rx={8}
          fill="none"
          stroke={colors.SECONDARY}
          strokeWidth={2}
        />
        <text x={IMG.x + IMG_W / 2} y={IMG.y + IMG_W + 28} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>
          one deep cell sees this whole patch
        </text>
      </g>

      {/* closing formula */}
      <MathLabel
        tex="\text{conv} \to \text{pool} \to \text{conv} \to \text{pool} \to \cdots"
        x={640}
        y={600}
        fontSize={20}
        color={colors.MUTED}
        opacity={closeU}
      />
    </Camera>
  );
}

export function VisionPooling() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/vision-pooling/overrides.json', slug: 'vision-pooling' }}
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
