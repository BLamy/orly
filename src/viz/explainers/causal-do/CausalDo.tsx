import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import { CLOUD, DAG, DO_SLOPE, OBS_SLOPE, buildScene, doF, obsF, px, py } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

function dagNode(x: number, y: number, label: string, color: string, u: number) {
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={30} fill={colors.PANEL} stroke={color} strokeWidth={2.5} />
      <text x={x} y={y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
        {label}
      </text>
    </g>
  );
}

function arrow(x1: number, y1: number, x2: number, y2: number, color: string, u: number, dashed = false) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const ax = x1 + ux * 34;
  const ay = y1 + uy * 34;
  const bx = x2 - ux * 36;
  const by = y2 - uy * 36;
  return (
    <g opacity={u}>
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={2.5} strokeDasharray={dashed ? '5 5' : undefined} />
      <polygon
        points={`${bx},${by} ${bx - ux * 10 - uy * 5},${by - uy * 10 + ux * 5} ${bx - ux * 10 + uy * 5},${by - uy * 10 - ux * 5}`}
        fill={color}
      />
    </g>
  );
}

function renderFrame(s: SceneState) {
  const dagU = s.get(scene.dagU);
  const cloudP = s.get(scene.cloudP);
  const obsU = s.get(scene.obsU);
  const cutU = s.get(scene.cutU);
  const doU = s.get(scene.doU);
  const gapU = s.get(scene.gapU);
  const chipU = s.get(scene.chipU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ── the structural model ── */}
      <g opacity={dagU}>
        <rect x={50} y={90} width={370} height={370} rx={14} fill={colors.PANEL} fillOpacity={0.45} stroke={colors.GRID} />
        <text x={235} y={122} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          the machine
        </text>
      </g>
      {dagNode(DAG.z.x, DAG.z.y, 'Z', colors.WARM, dagU)}
      {dagNode(DAG.x.x, DAG.x.y, 'X', colors.ACCENT, dagU)}
      {dagNode(DAG.y.x, DAG.y.y, 'Y', colors.TEXT, dagU)}
      {/* Z→X gets severed by cutU */}
      {arrow(DAG.z.x, DAG.z.y, DAG.x.x, DAG.x.y, colors.WARM, dagU * (1 - cutU))}
      {arrow(DAG.z.x, DAG.z.y, DAG.y.x, DAG.y.y, colors.WARM, dagU)}
      {arrow(DAG.x.x, DAG.x.y, DAG.y.x, DAG.y.y, colors.ACCENT, dagU)}
      {/* the cut mark */}
      <g opacity={cutU * dagU}>
        <line x1={148} y1={238} x2={188} y2={278} stroke={colors.NEGATIVE} strokeWidth={3} />
        <line x1={188} y1={238} x2={148} y2={278} stroke={colors.NEGATIVE} strokeWidth={3} />
        <text x={168} y={306} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13}>
          do(X = x)
        </text>
      </g>
      <g opacity={dagU}>
        <text x={235} y={440} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
          X = 1.5 Z + U · Y = 0.8 X + 2 Z + V
        </text>
      </g>

      {/* ── the two regimes ── */}
      <Axes x={px} y={py} reveal={clamp01(cloudP * 4)} grid xTicks={4} yTicks={5} xLabel="dose x" yLabel="outcome y" />
      {CLOUD.map((p, i) => (
        <circle
          key={i}
          cx={px(p.x)}
          cy={py(p.y)}
          r={2.6 * clamp01(cloudP * CLOUD.length - i)}
          fill={colors.MUTED}
          fillOpacity={0.55}
        />
      ))}
      <FunctionPlot x={px} y={py} f={obsF} domain={[-1, 3]} reveal={obsU} color={colors.NEGATIVE} width={3} />
      <FunctionPlot x={px} y={py} f={doF} domain={[-1, 3]} reveal={doU} color={colors.POSITIVE} width={3} />
      <g opacity={obsU}>
        <text x={px(3.02)} y={py(obsF(3)) + 4} fill={colors.NEGATIVE} fontSize={14}>
          seeing · slope {OBS_SLOPE.toFixed(2)}
        </text>
      </g>
      <g opacity={doU}>
        <text x={px(3.02)} y={py(doF(3)) + 4} fill={colors.POSITIVE} fontSize={14}>
          doing · slope {DO_SLOPE.toFixed(2)}
        </text>
      </g>
      {/* the confounding gap */}
      <g opacity={gapU}>
        <line x1={px(2.6)} y1={py(obsF(2.6))} x2={px(2.6)} y2={py(doF(2.6))} stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="4 5" />
        <text x={px(2.6) - 10} y={(py(obsF(2.6)) + py(doF(2.6))) / 2} textAnchor="end" fill={colors.WARM} fontSize={13}>
          the switch's ride
        </text>
      </g>

      {/* chip */}
      <g opacity={chipU}>
        <rect x={480} y={92} width={430} height={44} rx={10} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={695} y={120} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
          observed 1.63 = real effect 0.80 + confounding
        </text>
      </g>

      <MathLabel tex="\text{seeing} \neq \text{doing}" x={695} y={600} fontSize={21} color={colors.TEXT} opacity={closeU} />
    </Camera>
  );
}

export function CausalDo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/causal-do/overrides.json', slug: 'causal-do' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
