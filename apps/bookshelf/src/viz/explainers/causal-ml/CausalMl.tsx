import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  ACC_BOTH_SHIFT,
  ACC_BOTH_TRAIN,
  ACC_CAUSAL_SHIFT,
  ACC_CAUSAL_TRAIN,
  CAUSAL_CUT,
  SHIFT_VIS,
  SHIFT_WRONG_VIS,
  TRAIN_VIS,
  boundBoth,
  buildScene,
  px,
  py,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function accChip(x: number, y: number, label: string, val: number, color: string, u: number, key: string) {
  return (
    <g key={key} opacity={u}>
      <rect x={x} y={y} width={230} height={54} rx={11} fill={colors.PANEL} fillOpacity={0.94} stroke={color} />
      <text x={x + 16} y={y + 22} fill={colors.MUTED} fontSize={12}>
        {label}
      </text>
      <text x={x + 16} y={y + 45} fill={color} fontSize={18} fontFamily="ui-monospace, Menlo, monospace">
        {(val * 100).toFixed(0)}% accurate
      </text>
    </g>
  );
}

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const trainP = s.get(scene.trainP);
  const worldU = s.get(scene.worldU);
  const boundU = s.get(scene.boundU);
  const accTrainU = s.get(scene.accTrainU);
  const wrongU = s.get(scene.wrongU);
  const accShiftU = s.get(scene.accShiftU);
  const causalU = s.get(scene.causalU);
  const accCausalU = s.get(scene.accCausalU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      <Axes x={px} y={py} reveal={axU} grid xTicks={5} yTicks={5} xLabel="causal feature" yLabel="background feature" />
      <g opacity={clamp01(axU * 2) * (1 - worldU)}>
        <text x={550} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
          training world · background agrees 90%
        </text>
      </g>
      <g opacity={worldU}>
        <text x={550} y={92} textAnchor="middle" fill={colors.WARM} fontSize={15}>
          deployed world · background agrees 10%
        </text>
      </g>

      {/* the cloud: crossfades train → shifted */}
      {TRAIN_VIS.map((ex, i) => {
        const u = clamp01(trainP * TRAIN_VIS.length - i);
        const sh = SHIFT_VIS[i];
        const cx = px(lerp(ex.c, sh.c, worldU));
        const cy = py(lerp(ex.sp, sh.sp, worldU));
        const y = worldU > 0.5 ? sh.y : ex.y;
        const wrong = worldU > 0.5 && wrongU > 0.02 && SHIFT_WRONG_VIS[i];
        return (
          <g key={i} opacity={u}>
            <circle cx={cx} cy={cy} r={4.2} fill={y ? colors.ACCENT : colors.NEGATIVE} fillOpacity={0.8} />
            {wrong && <circle cx={cx} cy={cy} r={8} fill="none" stroke={colors.WARM} strokeWidth={1.8} opacity={wrongU} />}
          </g>
        );
      })}

      {/* the both-features boundary */}
      <FunctionPlot x={px} y={py} f={boundBoth} domain={[-3.2, 3.2]} reveal={boundU} color={colors.TEXT} width={2.5} dash />
      <g opacity={boundU}>
        <text x={px(-3.0)} y={py(boundBoth(-3.0)) - 12} fill={colors.TEXT} fontSize={13}>
          learned boundary — leans on the background
        </text>
      </g>

      {/* the causal-only boundary: vertical */}
      <g opacity={causalU}>
        <line x1={px(CAUSAL_CUT)} y1={py(-2.3)} x2={px(CAUSAL_CUT)} y2={py(2.3)} stroke={colors.POSITIVE} strokeWidth={2.5} />
        <text x={px(CAUSAL_CUT) + 10} y={py(2.15)} fill={colors.POSITIVE} fontSize={13}>
          causal-only boundary
        </text>
      </g>

      {/* accuracy scoreboard */}
      {accChip(980, 130, 'both features · training', ACC_BOTH_TRAIN, colors.TEXT, accTrainU, 'a')}
      {accChip(980, 200, 'both features · deployed', ACC_BOTH_SHIFT, colors.NEGATIVE, accShiftU, 'b')}
      {accChip(980, 290, 'causal only · training', ACC_CAUSAL_TRAIN, colors.MUTED, accCausalU, 'c')}
      {accChip(980, 360, 'causal only · deployed', ACC_CAUSAL_SHIFT, colors.POSITIVE, accCausalU, 'd')}

      <g opacity={closeU}>
        <text x={550} y={92} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
          causal features survive interventions — shortcuts do not
        </text>
      </g>
    </Camera>
  );
}

export function CausalMl() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/causal-ml/overrides.json', slug: 'causal-ml' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
