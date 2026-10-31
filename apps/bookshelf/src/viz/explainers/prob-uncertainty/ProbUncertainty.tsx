import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  DATA,
  FAN_X_MAX,
  FITS,
  FIT_ALL,
  NOISE_LEFT,
  N_FITS,
  buildScene,
  evalCubic,
  meanFit,
  spreadAt,
  sx,
  sy,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** aleatoric band path (mean ± 1.645σ over the dense region) */
const BAND_X0 = 0.02;
const BAND_X1 = 1.4;
const bandPath = (() => {
  const up: string[] = [];
  const dn: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = BAND_X0 + ((BAND_X1 - BAND_X0) * i) / 40;
    up.push(`${sx(x)},${sy(meanFit(x) + 1.645 * NOISE_LEFT)}`);
    dn.unshift(`${sx(x)},${sy(meanFit(x) - 1.645 * NOISE_LEFT)}`);
  }
  return `M ${up.join(' L ')} L ${dn.join(' L ')} Z`;
})();

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const dataP = s.get(scene.dataP);
  const fitU = s.get(scene.fitU);
  const fanP = s.get(scene.fanP);
  const edgeU = s.get(scene.edgeU);
  const epiU = s.get(scene.epiU);
  const aleU = s.get(scene.aleU);
  const noteU = s.get(scene.noteU);
  const closeU = s.get(scene.closeU);

  // the closing card takes over: the chart fades back so its text reads on a clean stage
  const chartOpacity = 1 - 0.85 * closeU;

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={chartOpacity}>
      <Axes x={sx} y={sy} reveal={axU} grid xTicks={5} yTicks={5} xLabel="input x" yLabel="output y" />

      {/* aleatoric band */}
      <path d={bandPath} fill={colors.WARM} fillOpacity={0.14 * aleU} stroke={colors.WARM} strokeOpacity={0.5 * aleU} strokeDasharray="4 6" />

      {/* the data */}
      {DATA.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={4.5 * clamp01(dataP * DATA.length - i)}
          fill={i < 35 ? colors.ACCENT : colors.TEAL}
          fillOpacity={0.85}
        />
      ))}

      {/* the single fit */}
      <FunctionPlot x={sx} y={sy} f={(x) => evalCubic(FIT_ALL, x)} domain={[0, FAN_X_MAX]} reveal={fitU} color={colors.TEXT} width={2.5} opacity={Math.min(1, fitU * 2)} />

      {/* the bootstrap fan */}
      {FITS.map((c, k) => (
        <FunctionPlot
          key={k}
          x={sx}
          y={sy}
          f={(x) => evalCubic(c, x)}
          domain={[0, FAN_X_MAX]}
          reveal={clamp01(fanP * N_FITS - k)}
          color={colors.SECONDARY}
          width={1.6}
          opacity={0.65}
        />
      ))}

      {/* the fan-width marker at the edge */}
      <g opacity={edgeU}>
        <line x1={sx(3.4)} y1={sy(meanFit(3.4) - spreadAt(3.4))} x2={sx(3.4)} y2={sy(meanFit(3.4) + spreadAt(3.4))} stroke={colors.SECONDARY} strokeWidth={3} />
        {/* label sits in the clear space right of the fan's end, beside the bracket */}
        <line x1={sx(3.4) + 6} y1={sy(meanFit(3.4))} x2={sx(3.4) + 16} y2={sy(meanFit(3.4))} stroke={colors.SECONDARY} strokeWidth={1.5} />
        <text x={sx(3.4) + 20} y={sy(meanFit(3.4)) - 2} textAnchor="start" fill={colors.SECONDARY} fontSize={15}>
          19.6× wider
        </text>
        <text x={sx(3.4) + 20} y={sy(meanFit(3.4)) + 16} textAnchor="start" fill={colors.SECONDARY} fontSize={15}>
          than in-data
        </text>
      </g>

      {/* labels: set above the bands and clear of the dots */}
      <g opacity={epiU}>
        <text x={sx(3.1)} y={140} textAnchor="middle" fill={colors.SECONDARY} fontSize={17}>
          epistemic · ignorance
        </text>
        <text x={sx(3.1)} y={162} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          shrinks with data
        </text>
      </g>
      <g opacity={aleU}>
        <text x={sx(0.7)} y={84} textAnchor="middle" fill={colors.WARM} fontSize={17}>
          aleatoric · noise
        </text>
        <text x={sx(0.7)} y={106} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          never shrinks
        </text>
      </g>

      {/* the two-responses note */}
      {/* the two-responses note: parked in the empty upper-right, clear of the curves */}
      <g opacity={noteU}>
        <rect x={840} y={100} width={370} height={76} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={1025} y={130} textAnchor="middle" fill={colors.SECONDARY} fontSize={15}>
          ignorance → gather data, or abstain
        </text>
        <text x={1025} y={158} textAnchor="middle" fill={colors.WARM} fontSize={15}>
          noise → plan for the spread
        </text>
      </g>
      </g>

      <g opacity={closeU}>
        <rect x={440} y={50} width={400} height={52} rx={12} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
        <text x={640} y={82} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
          two doubts, two responses
        </text>
      </g>
    </Camera>
  );
}

export function ProbUncertainty() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player
        timeline={scene.tl}
        loop
        motion={{ file: 'src/viz/explainers/prob-uncertainty/overrides.json', slug: 'prob-uncertainty' }}
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
