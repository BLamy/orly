import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  CELL,
  GAP,
  IMAGE,
  IMG,
  KCELL,
  KER_X,
  KER_Y,
  KPITCH,
  K_HORZ,
  K_RANDOM,
  K_TEX,
  K_VERT,
  MAP_HORZ,
  MAP_TEX,
  MAP_VERT,
  MAP_X,
  MCELL,
  MGAP,
  MPITCH,
  OUT_N,
  PITCH,
  ROW_Y,
  buildScene,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const KERNELS = [K_VERT, K_HORZ, K_TEX];
const MAPS = [MAP_VERT, MAP_HORZ, MAP_TEX];
const MAP_NAMES = ['vertical edges', 'horizontal edges', 'checker texture'];
const MAP_COLORS = [colors.ACCENT, colors.POSITIVE, colors.WARM];

/** kernel weight → 0..1 for heat display (affine, so lerp commutes) */
const normW = (w: number) => clamp01((w + 2) / 4);
const fmtW = (v: number) => {
  const w = v * 4 - 2;
  return Math.abs(w - Math.round(w)) < 0.02 ? String(Math.round(w)) : w.toFixed(1);
};

const MAP_W = OUT_N * MPITCH - MGAP;
const WIN_W = 3 * PITCH - GAP;

function renderFrame(s: SceneState) {
  const imgU = s.get(scene.imgU);
  const sweepP = s.get(scene.sweepP);
  const kRand = s.get(scene.kRand);
  const noteU = s.get(scene.noteU);
  const closeU = s.get(scene.closeU);

  // the sweep window position on the image (row-major over the 10×10 output)
  const pos = Math.min(OUT_N * OUT_N - 1, Math.floor(sweepP * OUT_N * OUT_N));
  const oi = Math.floor(pos / OUT_N);
  const oj = pos % OUT_N;
  const winOp = clamp01(Math.min(sweepP * 30, (1 - sweepP) * 30));

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── the image ── */}
      <text
        x={IMG.x + (12 * PITCH - GAP) / 2}
        y={IMG.y - 18}
        textAnchor="middle"
        fill={colors.MUTED}
        fontSize={15}
        opacity={clamp01(imgU * 8)}
      >
        image · 12×12 pixels
      </text>
      <MatrixGrid
        x={IMG.x}
        y={IMG.y}
        values={IMAGE}
        cell={CELL}
        gap={GAP}
        cellU={(i, j) => clamp01(imgU * 144 - (i * 12 + j))}
        emphasize={2}
      />

      {/* sweep window during beat 2 */}
      {winOp > 0.002 && (
        <g opacity={winOp}>
          <rect
            x={IMG.x + oj * PITCH - 3}
            y={IMG.y + oi * PITCH - 3}
            width={WIN_W + 6}
            height={WIN_W + 6}
            rx={7}
            fill={colors.ACCENT}
            fillOpacity={0.1}
            stroke={colors.ACCENT}
            strokeWidth={2.5}
          />
          <line
            x1={IMG.x + oj * PITCH + WIN_W + 8}
            y1={IMG.y + oi * PITCH + WIN_W / 2}
            x2={MAP_X + oj * MPITCH - 4}
            y2={ROW_Y[0] + 24 + oi * MPITCH + MCELL / 2}
            stroke={colors.MUTED}
            strokeWidth={1.5}
            strokeDasharray="3 7"
            opacity={0.7}
          />
        </g>
      )}

      {/* ── the kernel bank + the three maps ── */}
      {[0, 1, 2].map((k) => {
        const kU = s.get(scene.kU[k]);
        const mapP = s.get(scene.mapP[k]);
        const glow = s.get(scene.glow[k]);
        const kDisp = KERNELS[k].map((row, i) =>
          row.map((w, j) => normW(lerp(w, K_RANDOM[k][i][j], k > 0 ? kRand : kRand))),
        );
        return (
          <g key={k}>
            <g opacity={kU}>
              <rect
                x={KER_X - 10}
                y={KER_Y[k] - 10}
                width={3 * KPITCH - GAP + 20}
                height={3 * KPITCH - GAP + 20}
                rx={10}
                fill={colors.PANEL}
                fillOpacity={0.55}
                stroke={colors.GRID}
              />
            </g>
            <MatrixGrid
              x={KER_X}
              y={KER_Y[k]}
              values={kDisp}
              cell={KCELL}
              gap={GAP}
              cellU={(i, j) => clamp01(kU * 9 - (i * 3 + j))}
              emphasize={2}
              showValues={fmtW}
              labelSize={13}
            />
            {/* kernel → map arrow */}
            <g opacity={kU}>
              <line
                x1={KER_X + 3 * KPITCH + 8}
                y1={KER_Y[k] + (3 * KPITCH - GAP) / 2}
                x2={MAP_X - 18}
                y2={ROW_Y[k] + 24 + MAP_W / 2}
                stroke={colors.GRID}
                strokeWidth={1.5}
              />
            </g>
            {/* the feature map */}
            <text
              x={MAP_X + MAP_W / 2}
              y={ROW_Y[k] + 10}
              textAnchor="middle"
              fill={MAP_COLORS[k]}
              fontSize={14}
              opacity={clamp01(mapP * 10)}
            >
              {MAP_NAMES[k]}
            </text>
            <g opacity={0.28 + 0.72 * glow}>
              <rect
                x={MAP_X - 8}
                y={ROW_Y[k] + 24 - 8}
                width={MAP_W + 16}
                height={MAP_W + 16}
                rx={10}
                fill="none"
                stroke={MAP_COLORS[k]}
                strokeWidth={glow > 0.02 ? 2.5 : 1}
                opacity={clamp01(mapP * 10)}
              />
            </g>
            <MatrixGrid
              x={MAP_X}
              y={ROW_Y[k] + 24}
              values={MAPS[k]}
              cell={MCELL}
              gap={MGAP}
              cellU={(i, j) => clamp01(mapP * OUT_N * OUT_N - (i * OUT_N + j))}
              emphasize={2}
            />
          </g>
        );
      })}

      {/* the "texture hides from Sobel" note, pinned to the checker patch */}
      <g opacity={noteU}>
        <rect x={470} y={560} width={400} height={44} rx={10} fill={colors.PANEL} fillOpacity={0.9} stroke={colors.GRID} />
        <text x={670} y={588} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
          edge response on the checker patch: exactly 0
        </text>
        <line x1={475} y1={560} x2={IMG.x + 10 * PITCH} y2={IMG.y + 10 * PITCH} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="3 6" />
      </g>

      {/* closing: the maps are the layer's output */}
      <g opacity={closeU}>
        <MathLabel tex="\text{layer output} = 3 \times 10 \times 10" x={KER_X + 60} y={620} fontSize={19} color={colors.MUTED} anchor="start" />
        {[0, 1, 2].map((k) => (
          <line
            key={k}
            x1={MAP_X + MAP_W + 14}
            y1={ROW_Y[k] + 24 + MAP_W / 2}
            x2={MAP_X + MAP_W + 34}
            y2={ROW_Y[k] + 24 + MAP_W / 2}
            stroke={MAP_COLORS[k]}
            strokeWidth={2.5}
            markerEnd={undefined}
          />
        ))}
      </g>
    </Camera>
  );
}

export function VisionKernels() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/vision-kernels/overrides.json', slug: 'vision-kernels' }}
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
