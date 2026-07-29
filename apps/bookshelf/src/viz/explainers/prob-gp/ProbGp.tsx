import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  GRID,
  GRID_N,
  POST_MEAN,
  POST_SAMPLES,
  POST_SD,
  PRIOR_SAMPLES,
  SD_GAP,
  SD_OBS,
  XO,
  YO,
  buildScene,
  gridF,
  sx,
  sy,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const meanF = gridF(POST_MEAN);
const upF = gridF(POST_MEAN.map((m, i) => m + 2 * POST_SD[i]));
const dnF = gridF(POST_MEAN.map((m, i) => m - 2 * POST_SD[i]));
const priorFs = PRIOR_SAMPLES.map(gridF);
const postFs = POST_SAMPLES.map(gridF);

/** ±2σ band as one closed path */
const BAND_PATH = (() => {
  const up: string[] = [];
  const dn: string[] = [];
  for (let i = 0; i < GRID_N; i++) {
    up.push(`${sx(GRID[i])},${sy(POST_MEAN[i] + 2 * POST_SD[i])}`);
    dn.unshift(`${sx(GRID[i])},${sy(POST_MEAN[i] - 2 * POST_SD[i])}`);
  }
  return `M ${up.join(' L ')} L ${dn.join(' L ')} Z`;
})();

const PRIOR_COLORS = [colors.SECONDARY, colors.TEAL, colors.MUTED];

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const priorP = s.get(scene.priorP);
  const kernU = s.get(scene.kernU);
  const obsP = s.get(scene.obsP);
  const priorFade = s.get(scene.priorFade);
  const meanU = s.get(scene.meanU);
  const bandU = s.get(scene.bandU);
  const pinchU = s.get(scene.pinchU);
  const sampP = s.get(scene.sampP);
  const costU = s.get(scene.costU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      <Axes x={sx} y={sy} reveal={axU} grid xTicks={5} yTicks={5} xLabel="input x" yLabel="f(x)" />

      {/* posterior band */}
      <path d={BAND_PATH} fill={colors.ACCENT} fillOpacity={0.16 * bandU} stroke="none" />
      <FunctionPlot x={sx} y={sy} f={upF} domain={[0, 4]} reveal={bandU} color={colors.ACCENT} width={1} opacity={0.5} />
      <FunctionPlot x={sx} y={sy} f={dnF} domain={[0, 4]} reveal={bandU} color={colors.ACCENT} width={1} opacity={0.5} />

      {/* prior samples */}
      {priorFs.map((f, k) => (
        <FunctionPlot
          key={`p${k}`}
          x={sx}
          y={sy}
          f={f}
          domain={[0, 4]}
          reveal={clamp01(priorP * 3 - k)}
          color={PRIOR_COLORS[k]}
          width={1.8}
          opacity={0.8 * priorFade}
        />
      ))}

      {/* posterior samples */}
      {postFs.map((f, k) => (
        <FunctionPlot
          key={`q${k}`}
          x={sx}
          y={sy}
          f={f}
          domain={[0, 4]}
          reveal={clamp01(sampP * 2 - k)}
          color={k === 0 ? colors.SECONDARY : colors.TEAL}
          width={1.8}
          opacity={0.85}
        />
      ))}

      {/* posterior mean */}
      <FunctionPlot x={sx} y={sy} f={meanF} domain={[0, 4]} reveal={meanU} color={colors.TEXT} width={2.5} />

      {/* observations */}
      {XO.map((x, i) => (
        <g key={i} opacity={clamp01(obsP * XO.length - i)}>
          <circle cx={sx(x)} cy={sy(YO[i])} r={6} fill={colors.WARM} stroke="#0a0e1a" strokeWidth={1.5} />
        </g>
      ))}

      {/* pinch-vs-balloon annotation */}
      <g opacity={pinchU}>
        <line x1={sx(2.2)} y1={sy(meanF(2.2) - 2 * SD_GAP)} x2={sx(2.2)} y2={sy(meanF(2.2) + 2 * SD_GAP)} stroke={colors.NEGATIVE} strokeWidth={2.5} />
        <text x={sx(2.2) + 12} y={sy(meanF(2.2))} fill={colors.NEGATIVE} fontSize={14}>
          σ = {SD_GAP.toFixed(2)}
        </text>
        <line x1={sx(1.0)} y1={sy(meanF(1.0) - 2 * SD_OBS)} x2={sx(1.0)} y2={sy(meanF(1.0) + 2 * SD_OBS)} stroke={colors.POSITIVE} strokeWidth={2.5} />
        <text x={sx(1.0) - 12} y={sy(meanF(1.0)) - 14} textAnchor="end" fill={colors.POSITIVE} fontSize={14}>
          σ = {SD_OBS.toFixed(2)}
        </text>
      </g>

      {/* kernel chip */}
      <g opacity={kernU * priorFade}>
        <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          length scale ℓ = 0.5 · noise σ² = 0.005
        </text>
      </g>

      {/* cost chip */}
      <MathLabel tex="(K + \sigma^2 I)^{-1} \;\text{— one row per observation}" x={640} y={90} fontSize={18} color={colors.MUTED} opacity={costU} />

      <g opacity={closeU}>
        <text x={640} y={86} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
          small data, exact doubt
        </text>
      </g>
    </Camera>
  );
}

export function ProbGp() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/prob-gp/overrides.json', slug: 'prob-gp' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
