import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';
import { DATA, FIT_A, FIT_B, FIT_POOLED, buildScene, sx, sy } from './scene';
import type { Fit } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

function fitLine(f: Fit, x0: number, x1: number, color: string, u: number, label: string, key: string) {
  const xm = x0 + (x1 - x0) * u;
  return (
    <g key={key} opacity={u > 0 ? 1 : 0}>
      <line x1={sx(x0)} y1={sy(f.intercept + f.slope * x0)} x2={sx(xm)} y2={sy(f.intercept + f.slope * xm)} stroke={color} strokeWidth={3} />
      {u > 0.9 && (
        <text x={sx(x1) + 10} y={sy(f.intercept + f.slope * x1) + 4} fill={color} fontSize={14}>
          {label}
        </text>
      )}
    </g>
  );
}

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const dataP = s.get(scene.dataP);
  const pooledU = s.get(scene.pooledU);
  const colorU = s.get(scene.colorU);
  const fitAU = s.get(scene.fitAU);
  const fitBU = s.get(scene.fitBU);
  const dagU = s.get(scene.dagU);
  const chipU = s.get(scene.chipU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      <Axes x={sx} y={sy} reveal={axU} grid xTicks={5} yTicks={5} xLabel="dose" yLabel="outcome" />

      {/* the data */}
      {DATA.map((p, i) => {
        const u = clamp01(dataP * DATA.length - i);
        const groupColor = p.g === 0 ? colors.ACCENT : colors.WARM;
        return (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={5 * u}
            fill={colorU > 0.02 ? groupColor : colors.MUTED}
            fillOpacity={0.85}
            stroke="#0a0e1a"
            strokeWidth={1}
          />
        );
      })}

      {/* fits */}
      <g opacity={Math.max(pooledU, 0.001)}>
        {fitLine(FIT_POOLED, 0, 4.1, colors.NEGATIVE, Math.min(1, pooledU * (pooledU > 0.3 ? 1 : pooledU * 3)), `pooled: ${FIT_POOLED.slope.toFixed(2)}`, 'pool')}
      </g>
      {fitLine(FIT_A, 0, 2.0, colors.ACCENT, fitAU, `mild: +${FIT_A.slope.toFixed(2)}`, 'a')}
      {fitLine(FIT_B, 2.0, 4.0, colors.WARM, fitBU, `severe: +${FIT_B.slope.toFixed(2)}`, 'b')}

      {/* group labels */}
      <g opacity={colorU}>
        <text x={sx(0.9)} y={sy(3.8)} textAnchor="middle" fill={colors.ACCENT} fontSize={15}>
          mild cases
        </text>
        <text x={sx(3.2)} y={sy(-0.6)} textAnchor="middle" fill={colors.WARM} fontSize={15}>
          severe cases
        </text>
      </g>

      {/* the verdict chip */}
      <g opacity={chipU}>
        <rect x={430} y={92} width={420} height={68} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={640} y={120} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
          within every group: slope ≈ +0.7 … +0.8
        </text>
        <text x={640} y={146} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15}>
          pooled: slope = {FIT_POOLED.slope.toFixed(2)}
        </text>
      </g>

      {/* the confounder DAG */}
      <g opacity={dagU}>
        <rect x={905} y={92} width={280} height={140} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={1045} y={122} textAnchor="middle" fill={colors.WARM} fontSize={15}>
          severity Z
        </text>
        <text x={955} y={210} textAnchor="middle" fill={colors.ACCENT} fontSize={15}>
          dose X
        </text>
        <text x={1135} y={210} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
          outcome Y
        </text>
        <line x1={1020} y1={132} x2={965} y2={192} stroke={colors.WARM} strokeWidth={2} />
        <line x1={1070} y1={132} x2={1125} y2={192} stroke={colors.WARM} strokeWidth={2} />
        <line x1={985} y1={205} x2={1095} y2={205} stroke={colors.MUTED} strokeWidth={2} strokeDasharray="4 5" />
      </g>

      <g opacity={closeU}>
        <text x={640} y={80} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
          same data, opposite answers — the confounder decides
        </text>
      </g>
    </Camera>
  );
}

export function CausalSimpson() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/causal-simpson/overrides.json', slug: 'causal-simpson' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
