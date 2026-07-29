import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { MatrixGrid } from '../../primitives';
import overrides from './overrides.json';
import {
  BASE_SCORE,
  DC,
  DG,
  DP,
  DROPS,
  DROP_XY,
  IC,
  IG,
  IMAGE,
  IMG_N,
  IMG_XY,
  IP,
  METER,
  OCC_N,
  OCC_SCORES,
  buildScene,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const IMG_W = IMG_N * IP - IG;
const DROP_W = OCC_N * DP - DG;
const MASK_W = 4 * IP - IG;

/** drop-map cells with the given drop value (for the ring/hole highlights) */
const RING_CELLS: Array<[number, number]> = [];
const HOLE_CELLS: Array<[number, number]> = [];
for (let i = 0; i < OCC_N; i++)
  for (let j = 0; j < OCC_N; j++)
    (DROPS[i][j] > 1e-9 ? RING_CELLS : HOLE_CELLS).push([i, j]);

/** drop map scaled so 0.25 reads bright */
const DROP_DISP = DROPS.map((r) => r.map((v) => v * 4));

function renderFrame(s: SceneState) {
  const imgU = s.get(scene.imgU);
  const meterU = s.get(scene.meterU);
  const demoU = s.get(scene.demoU);
  const sweepP = s.get(scene.sweepP);
  const ringU = s.get(scene.ringU);
  const holeU = s.get(scene.holeU);
  const floorU = s.get(scene.floorU);
  const closeU = s.get(scene.closeU);

  // the sweep: row-major over the 36 occluder positions
  const pos = Math.min(OCC_N * OCC_N - 1, Math.floor(sweepP * OCC_N * OCC_N));
  const oi = Math.floor(pos / OCC_N);
  const oj = pos % OCC_N;
  const sweepOp = clamp01(Math.min(sweepP * 30, (1 - sweepP) * 30));

  // what the meter reads right now: base → demo (0.75) → per-sweep score
  const demoScore = BASE_SCORE * (1 - DROPS[0][0]);
  let meterVal = BASE_SCORE;
  if (sweepOp > 0.002) meterVal = OCC_SCORES[pos];
  else if (demoU > 0.002) meterVal = BASE_SCORE + (demoScore - BASE_SCORE) * demoU;
  const meterFill = meterVal / BASE_SCORE;

  // the occluder rect on the image (demo pins it at the top-left corner)
  const maskI = sweepOp > 0.002 ? oi : 0;
  const maskJ = sweepOp > 0.002 ? oj : 0;
  const maskOp = Math.max(demoU, sweepOp);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── the image ── */}
      <text x={IMG_XY.x + IMG_W / 2} y={IMG_XY.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(imgU * 8)}>
        input · 14×14
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
      {/* the gray occluder */}
      {maskOp > 0.002 && (
        <g opacity={maskOp}>
          <rect
            x={IMG_XY.x + 2 * maskJ * IP - 2}
            y={IMG_XY.y + 2 * maskI * IP - 2}
            width={MASK_W + 4}
            height={MASK_W + 4}
            rx={6}
            fill="#4b5568"
            fillOpacity={0.96}
            stroke={colors.TEXT}
            strokeWidth={1.5}
          />
          <text
            x={IMG_XY.x + 2 * maskJ * IP + MASK_W / 2}
            y={IMG_XY.y + 2 * maskI * IP + MASK_W / 2 + 5}
            textAnchor="middle"
            fill={colors.TEXT}
            fontSize={13}
          >
            ▨
          </text>
        </g>
      )}

      {/* ── the score meter ── */}
      <g opacity={meterU}>
        <text x={METER.x + METER.w / 2} y={METER.y - 18} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          score
        </text>
        <rect x={METER.x} y={METER.y} width={METER.w} height={METER.h} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
        <rect
          x={METER.x + 4}
          y={METER.y + 4 + (METER.h - 8) * (1 - meterFill)}
          width={METER.w - 8}
          height={(METER.h - 8) * meterFill}
          rx={5}
          fill={meterFill > 0.9 ? colors.POSITIVE : colors.WARM}
        />
        <text x={METER.x + METER.w / 2} y={METER.y + METER.h + 26} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily="ui-monospace, Menlo, monospace">
          {meterVal.toFixed(2)}
        </text>
        {/* the 0.75 floor line */}
        <g opacity={floorU}>
          <line
            x1={METER.x - 10}
            y1={METER.y + 4 + (METER.h - 8) * 0.25}
            x2={METER.x + METER.w + 10}
            y2={METER.y + 4 + (METER.h - 8) * 0.25}
            stroke={colors.NEGATIVE}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <text x={METER.x + METER.w + 16} y={METER.y + 4 + (METER.h - 8) * 0.25 + 5} fill={colors.NEGATIVE} fontSize={13}>
            floor 0.75
          </text>
        </g>
      </g>

      {/* ── the drop map ── */}
      <text x={DROP_XY.x + DROP_W / 2} y={DROP_XY.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(sweepP * 8)}>
        occlusion saliency · score drop per position
      </text>
      <MatrixGrid
        x={DROP_XY.x}
        y={DROP_XY.y}
        values={DROP_DISP}
        cell={DC}
        gap={DG}
        cellU={(i, j) => clamp01(sweepP * 36 - (i * 6 + j))}
        emphasize={2}
        showValues={(v) => (v / 4).toFixed(2)}
        labelSize={12}
      />
      {/* ring / hole highlights */}
      <g opacity={ringU}>
        {RING_CELLS.map(([i, j]) => (
          <rect key={`r${i}-${j}`} x={DROP_XY.x + j * DP - 2} y={DROP_XY.y + i * DP - 2} width={DC + 4} height={DC + 4} rx={6} fill="none" stroke={colors.WARM} strokeWidth={2} />
        ))}
      </g>
      <g opacity={holeU}>
        {HOLE_CELLS.map(([i, j]) => (
          <rect key={`h${i}-${j}`} x={DROP_XY.x + j * DP - 2} y={DROP_XY.y + i * DP - 2} width={DC + 4} height={DC + 4} rx={6} fill="none" stroke={colors.TEAL} strokeWidth={2.5} />
        ))}
      </g>

      {/* closing */}
      <MathLabel
        tex="\text{saliency}(p) = s(x) - s(x \setminus p)"
        x={640}
        y={600}
        fontSize={21}
        color={colors.MUTED}
        opacity={closeU}
      />
    </Camera>
  );
}

export function VisionOcclusion() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/vision-occlusion/overrides.json', slug: 'vision-occlusion' }}
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
