import { MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { MatrixGrid } from '../../primitives';
import {
  BLUR_K_DISP,
  BLUR_OUT,
  CELL,
  GAP,
  IMAGE,
  IMG,
  KCELL,
  KER,
  KPITCH,
  MACS,
  MAC_Y,
  OUT,
  OUT_N,
  PITCH,
  SOBEL_K_DISP,
  SOBEL_OUT,
  buildScene,
  fmtKernel,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpGrid = (A: number[][], B: number[][], u: number) =>
  u <= 0 ? A : u >= 1 ? B : A.map((r, i) => r.map((v, j) => lerp(v, B[i][j], u)));

const fmt2 = (v: number) => v.toFixed(2);
const WIN_W = 3 * PITCH - GAP; // the 3×3 window's footprint on the image

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const imgP = s.get(scene.imgP);
  const kernelU = s.get(scene.kernelU);
  const ovU = s.get(scene.overlayU);
  const p = s.get(scene.slideP);
  const panelU = s.get(scene.outPanelU);
  const blend = s.get(scene.kBlend);

  // THE slide: one progress channel → a discrete window position, row-major
  // over the 6×6 output. The output map's cells cascade off the same channel.
  const pos = Math.min(OUT_N * OUT_N - 1, Math.floor(p * OUT_N * OUT_N));
  const oi = Math.floor(pos / OUT_N);
  const oj = pos % OUT_N;
  const outCellU = (i: number, j: number) =>
    clamp01((p * OUT_N * OUT_N - (i * OUT_N + j)) * 1.4);

  // kernel + feature map crossfade between the two precomputed states
  const kernelDisp = lerpGrid(BLUR_K_DISP, SOBEL_K_DISP, blend);
  const outDisp = lerpGrid(BLUR_OUT, SOBEL_OUT, blend);
  // emphasis only wakes up with the Sobel blend, so its edge columns catch fire
  const outEmphasize = 2 - 1.13 * blend;

  // the window rect on the image, and the output cell it is writing
  const wx = IMG.x + oj * PITCH - 3;
  const wy = IMG.y + oi * PITCH - 3;

  return (
    <g>
      {/* ── the image: 8×8 grid of numbers, stage-left ── */}
      <text x={IMG.x + (8 * PITCH - GAP) / 2} y={IMG.y - 18} textAnchor="middle" fill={colors.MUTED} fontSize={15} opacity={clamp01(imgP * 10)}>
        image · 8×8 pixels
      </text>
      <MatrixGrid
        x={IMG.x}
        y={IMG.y}
        values={IMAGE}
        cell={CELL}
        gap={GAP}
        cellU={(i, j) => clamp01(imgP * 64 - (i * 8 + j))}
        emphasize={2}
        showValues={fmt2}
        labelSize={12}
      />

      {/* ── the kernel: a small floating window of weights, top-center ── */}
      <g opacity={kernelU}>
        <rect x={KER.x - 10} y={KER.y - 10} width={3 * KPITCH - GAP + 20} height={3 * KPITCH - GAP + 20} rx={12} fill={colors.PANEL} fillOpacity={0.5} stroke={colors.GRID} />
        <text x={KER.x + (3 * KPITCH - GAP) / 2} y={KER.y + 3 * KPITCH - GAP + 26} textAnchor="middle" fill={colors.MUTED} fontSize={15} opacity={1 - blend}>
          box blur · every weight 1/9
        </text>
        <text x={KER.x + (3 * KPITCH - GAP) / 2} y={KER.y + 3 * KPITCH - GAP + 26} textAnchor="middle" fill={colors.WARM} fontSize={15} opacity={blend}>
          Sobel · vertical edge detector
        </text>
      </g>
      <MatrixGrid
        x={KER.x}
        y={KER.y}
        values={kernelDisp}
        cell={KCELL}
        gap={GAP}
        cellU={(i, j) => clamp01(kernelU * 9 - (i * 3 + j))}
        emphasize={2}
        showValues={fmtKernel}
        labelSize={15}
      />

      {/* ── the sliding window: highlight rect + kernel weights ON the image ── */}
      {ovU > 0.002 && (
        <g opacity={ovU}>
          <rect x={wx} y={wy} width={WIN_W + 6} height={WIN_W + 6} rx={8} fill={colors.WARM} fillOpacity={0.09} stroke={colors.WARM} strokeWidth={2.5} />
          {[0, 1, 2].map((u) =>
            [0, 1, 2].map((v) => (
              <text
                key={`k${u}-${v}`}
                x={IMG.x + (oj + v) * PITCH + CELL / 2}
                y={IMG.y + (oi + u) * PITCH + CELL - 5}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={10}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                ×0.11
              </text>
            )),
          )}
          {/* window → the output pixel it is writing */}
          <line
            x1={wx + WIN_W + 10}
            y1={wy + WIN_W / 2}
            x2={OUT.x + oj * PITCH - 6}
            y2={OUT.y + oi * PITCH + CELL / 2}
            stroke={colors.MUTED}
            strokeWidth={1.5}
            strokeDasharray="3 7"
            opacity={0.8}
          />
        </g>
      )}

      {/* ── the feature map: 6×6, stage-right ── */}
      <g opacity={panelU}>
        <rect x={OUT.x - 10} y={OUT.y - 10} width={OUT_N * PITCH - GAP + 20} height={OUT_N * PITCH - GAP + 20} rx={12} fill={colors.PANEL} fillOpacity={0.5} stroke={colors.GRID} />
        <text x={OUT.x + (OUT_N * PITCH - GAP) / 2} y={OUT.y - 18} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
          feature map · 6×6
        </text>
      </g>
      <MatrixGrid
        x={OUT.x}
        y={OUT.y}
        values={outDisp}
        cell={CELL}
        gap={GAP}
        cellU={outCellU}
        emphasize={outEmphasize}
        showValues={fmt2}
        labelSize={12}
        highlight={{ cell: [oi, oj] as [number, number], color: colors.WARM, u: ovU }}
      />

      {/* ── the multiply-accumulates at the dwell positions ── */}
      {MACS.map((m, i) => (
        <MathLabel key={m.pos} tex={m.tex} x={640} y={MAC_Y} fontSize={22} opacity={s.get(scene.macU[i])} />
      ))}

      {/* ── the definition, once the second kernel has made the point ── */}
      <MathLabel
        tex="(f*g)[i,j]=\sum_{u,v} f[i+u,j+v]\,g[u,v]"
        x={640}
        y={MAC_Y}
        fontSize={24}
        opacity={s.get(scene.formulaU)}
      />
    </g>
  );
}

export function Convolution() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/convolution/overrides.json', slug: 'convolution' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
