import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';
import {
  ADJUSTED,
  CLOUD,
  FIT_ALL,
  FIT_Z0,
  FIT_Z1,
  TRUE_EFFECT,
  buildScene,
  px,
  py,
} from './scene';
import type { Fit } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

function fitLine(f: Fit, x0: number, x1: number, color: string, u: number, label: string, key: string) {
  const xm = x0 + (x1 - x0) * Math.min(1, u);
  return (
    <g key={key} opacity={u > 0.001 ? Math.min(1, u * 3) : 0}>
      <line x1={px(x0)} y1={py(f.intercept + f.slope * x0)} x2={px(xm)} y2={py(f.intercept + f.slope * xm)} stroke={color} strokeWidth={3} />
      {u > 0.9 && (
        <text x={px(x1) + 10} y={py(f.intercept + f.slope * x1) + 4} fill={color} fontSize={14}>
          {label}
        </text>
      )}
    </g>
  );
}

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const cloudP = s.get(scene.cloudP);
  const naiveU = s.get(scene.naiveU);
  const colorU = s.get(scene.colorU);
  const fit0U = s.get(scene.fit0U);
  const fit1U = s.get(scene.fit1U);
  const mathU = s.get(scene.mathU);
  const scaleU = s.get(scene.scaleU);
  const cautionU = s.get(scene.cautionU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      <Axes x={px} y={py} reveal={axU} grid xTicks={5} yTicks={5} xLabel="dose x" yLabel="outcome y" />

      {CLOUD.map((p, i) => (
        <circle
          key={i}
          cx={px(p.x)}
          cy={py(p.y)}
          r={3 * clamp01(cloudP * CLOUD.length - i)}
          fill={colorU > 0.02 ? (p.z === 0 ? colors.ACCENT : colors.WARM) : colors.MUTED}
          fillOpacity={0.6}
        />
      ))}

      {fitLine(FIT_ALL, -1.2, 3.0, colors.NEGATIVE, naiveU, `naive: ${FIT_ALL.slope.toFixed(2)}`, 'all')}
      {fitLine(FIT_Z0, -1.4, 1.4, colors.ACCENT, fit0U, `z = 0: ${FIT_Z0.slope.toFixed(2)}`, 'z0')}
      {fitLine(FIT_Z1, 0.2, 3.0, colors.WARM, fit1U, `z = 1: ${FIT_Z1.slope.toFixed(2)}`, 'z1')}

      {/* the weighted-average scale */}
      <g opacity={scaleU}>
        <rect x={430} y={92} width={420} height={70} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={640} y={120} textAnchor="middle" fill={colors.POSITIVE} fontSize={16}>
          adjusted effect = {ADJUSTED.toFixed(2)}
        </text>
        <text x={640} y={146} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          truth built into the machine: {TRUE_EFFECT.toFixed(2)} · naive: {FIT_ALL.slope.toFixed(2)}
        </text>
      </g>

      <MathLabel
        tex="P(y \mid \mathrm{do}(x)) = \sum_z P(y \mid x, z)\, P(z)"
        x={640}
        y={600}
        fontSize={20}
        color={colors.TEXT}
        opacity={mathU * (1 - closeU)}
      />

      {/* the fine print */}
      <g opacity={cautionU}>
        <rect x={880} y={92} width={310} height={96} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.NEGATIVE} />
        <text x={900} y={122} fill={colors.NEGATIVE} fontSize={14}>
          requires: every backdoor blocked
        </text>
        <text x={900} y={148} fill={colors.MUTED} fontSize={13}>
          unmeasured confounder → silent bias
        </text>
        <text x={900} y={172} fill={colors.MUTED} fontSize={13}>
          untestable from this data alone
        </text>
      </g>

      <g opacity={closeU}>
        <text x={640} y={600} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
          measure the switch, freeze it, average it back — or randomize
        </text>
      </g>
    </Camera>
  );
}

export function CausalBackdoor() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/causal-backdoor/overrides.json', slug: 'causal-backdoor' }}
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
