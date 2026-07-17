import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  ATTN,
  CUT_SPREAD,
  IMG0,
  MAT,
  MCELL,
  MGAP,
  MP,
  NP,
  PATCH,
  PATCH_W,
  PCELL,
  PGAP,
  PP,
  SCELL,
  SGAP,
  SPP,
  STRIP_DX,
  STRIP_W,
  STRIP_X0,
  STRIP_Y,
  buildScene,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const MAT_W = NP * MP - MGAP;

/** patch k's top-left corner + cell size as a function of cut/strip progress */
function patchFrame(k: number, cutU: number, stripU: number) {
  const r = Math.floor(k / 3);
  const c = k % 3;
  const homeX = IMG0.x + c * (PATCH_W + PGAP) + (c - 1) * cutU * CUT_SPREAD;
  const homeY = IMG0.y + r * (PATCH_W + PGAP) + (r - 1) * cutU * CUT_SPREAD;
  const stripX = STRIP_X0 + k * STRIP_DX;
  const u = stripU;
  return {
    x: lerp(homeX, stripX, u),
    y: lerp(homeY, STRIP_Y, u),
    cell: lerp(PCELL, SCELL, u),
    gap: lerp(PGAP, SGAP, u),
  };
}

/** arc between two token centers above the strip */
function arc(i: number, j: number, u: number, color: string, w: number, key: string) {
  const xi = STRIP_X0 + i * STRIP_DX + STRIP_W / 2;
  const xj = STRIP_X0 + j * STRIP_DX + STRIP_W / 2;
  const y = STRIP_Y - 10;
  const mid = (xi + xj) / 2;
  const lift = Math.min(64, Math.abs(xj - xi) * 0.12 + 22);
  return (
    <path
      key={key}
      d={`M ${xi} ${y} Q ${mid} ${y - lift} ${xj} ${y}`}
      fill="none"
      stroke={color}
      strokeWidth={w}
      opacity={u}
      strokeDasharray="1 0"
      pathLength={1}
      strokeDashoffset={0}
    />
  );
}

function renderFrame(s: SceneState) {
  const imgU = s.get(scene.imgU);
  const cutU = s.get(scene.cutU);
  const stripP = s.get(scene.stripP);
  const posU = s.get(scene.posU);
  const matU = s.get(scene.matU);
  const rowTwinU = s.get(scene.rowTwinU);
  const rowEdgeU = s.get(scene.rowEdgeU);
  const rowBlankU = s.get(scene.rowBlankU);
  const arcTwinU = s.get(scene.arcTwinU);
  const arcEdgeU = s.get(scene.arcEdgeU);
  const noteU = s.get(scene.noteU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── the nine patches (one persistent object: grid → token strip) ── */}
      {PATCH.map((p, k) => {
        const su = clamp01(stripP * NP - k * 0.6);
        const f = patchFrame(k, cutU, su);
        return (
          <g key={k}>
            <MatrixGrid
              x={f.x}
              y={f.y}
              values={p}
              cell={f.cell}
              gap={f.gap}
              cellU={(i, j) => clamp01(imgU * 144 - ((Math.floor(k / 3) * 4 + i) * 12 + ((k % 3) * 4 + j)))}
              emphasize={2}
            />
            {/* position tag under each token */}
            <text
              x={STRIP_X0 + k * STRIP_DX + STRIP_W / 2}
              y={STRIP_Y + STRIP_W + 18}
              textAnchor="middle"
              fill={colors.MUTED}
              fontSize={12}
              opacity={posU * su}
            >
              {k + 1}
            </text>
          </g>
        );
      })}

      {/* attention arcs above the strip */}
      {arc(0, 8, arcTwinU, colors.WARM, 3 + 4 * ATTN[0][8], 'twin')}
      {arc(2, 4, arcEdgeU, colors.ACCENT, 3 + 4 * ATTN[2][4], 'edge')}

      {/* ── the attention matrix ── */}
      <text x={MAT.x + MAT_W / 2} y={MAT.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(matU * 8)}>
        attention · 9×9 · row = who patch looks at
      </text>
      <MatrixGrid
        x={MAT.x}
        y={MAT.y}
        values={ATTN}
        cell={MCELL}
        gap={MGAP}
        cellU={(i, j) => clamp01(matU * 81 - (i * 9 + j))}
        emphasize={2}
        showValues={(v) => v.toFixed(2)}
        labelSize={9}
        rowLabels={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
        colLabels={['1', '2', '3', '4', '5', '6', '7', '8', '9']}
        highlight={
          rowTwinU > 0.01
            ? { row: 0, color: colors.WARM, u: rowTwinU }
            : rowEdgeU > 0.01
              ? { row: 2, color: colors.ACCENT, u: rowEdgeU }
              : { row: 1, color: colors.MUTED, u: rowBlankU }
        }
      />

      {/* the computed anchors, pinned beside the matrix */}
      <g opacity={Math.max(rowTwinU, rowEdgeU, rowBlankU)}>
        <rect x={MAT.x + MAT_W + 46} y={330} width={330} height={110} rx={12} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
        <text x={MAT.x + MAT_W + 66} y={366} fill={colors.WARM} fontSize={15} opacity={Math.max(rowTwinU, 0.4)}>
          checker twins: 0.47 to each other
        </text>
        <text x={MAT.x + MAT_W + 66} y={392} fill={colors.ACCENT} fontSize={15} opacity={Math.max(rowEdgeU, 0.4)}>
          edge pair: 0.47 to each other
        </text>
        <text x={MAT.x + MAT_W + 66} y={418} fill={colors.MUTED} fontSize={15} opacity={Math.max(rowBlankU, 0.4)}>
          blank patches: ≈ 0.11 everywhere
        </text>
      </g>

      {/* the honest-trade note */}
      <g opacity={noteU}>
        <rect x={760} y={470} width={430} height={92} rx={12} fill={colors.PANEL} fillOpacity={0.92} stroke={colors.GRID} />
        <text x={780} y={504} fill={colors.TEXT} fontSize={15}>
          convolution: locality built in, data cheap
        </text>
        <text x={780} y={534} fill={colors.TEXT} fontSize={15}>
          transformer: locality learned, data hungry
        </text>
      </g>

      {/* closing */}
      <MathLabel
        tex="\text{patches} \to \text{tokens} \to \text{attention}"
        x={960}
        y={600}
        fontSize={20}
        color={colors.MUTED}
        opacity={closeU}
      />
    </Camera>
  );
}

export function VisionPatches() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/vision-patches/overrides.json', slug: 'vision-patches' }}
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
