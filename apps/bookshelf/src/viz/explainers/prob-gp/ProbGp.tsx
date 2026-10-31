import { Camera, Player, colors } from '../../core';
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

const PRIOR_BAND = `M ${sx(0)},${sy(2)} L ${sx(4)},${sy(2)} L ${sx(4)},${sy(-2)} L ${sx(0)},${sy(-2)} Z`;

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

      {/* prior ±2σ envelope: the prior has σ = 1 everywhere, so it is a flat strip */}
      <g opacity={axU * priorFade}>
        <path d={PRIOR_BAND} fill={colors.MUTED} fillOpacity={0.08} stroke="none" />
        <line x1={sx(0)} y1={sy(2)} x2={sx(4)} y2={sy(2)} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="4 5" opacity={0.5} />
        <line x1={sx(0)} y1={sy(-2)} x2={sx(4)} y2={sy(-2)} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="4 5" opacity={0.5} />
      </g>

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
        {/* labels sit just above each band's top edge, with a dark halo so the band line never cuts through them */}
        <text x={sx(2.2) + 8} y={sy(meanF(2.2) + 2 * SD_GAP) - 10} fill={colors.NEGATIVE} fontSize={14} stroke="#0a0e1a" strokeWidth={4} paintOrder="stroke">
          σ = {SD_GAP.toFixed(2)}
        </text>
        <line x1={sx(1.0)} y1={sy(meanF(1.0) - 2 * SD_OBS)} x2={sx(1.0)} y2={sy(meanF(1.0) + 2 * SD_OBS)} stroke={colors.POSITIVE} strokeWidth={2.5} />
        <text x={sx(1.0)} y={sy(meanF(1.0) + 2 * SD_OBS) - 10} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} stroke="#0a0e1a" strokeWidth={4} paintOrder="stroke">
          σ = {SD_OBS.toFixed(2)}
        </text>
      </g>

      {/* kernel chip, faded out once the cost chip or the closing text takes its slot */}
      <g opacity={kernU * priorFade * (1 - costU) * (1 - closeU)}>
        <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          length scale ℓ = 0.5 · noise σ² = 0.005
        </text>
      </g>

      {/* cost chip: plain text, so no KaTeX fallback copy can double up beside it */}
      <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={18} opacity={costU}>
        (K + σ²I)⁻¹ — one row per observation
      </text>

      {/* closing text on a solid panel, so no half-faded chart content shows through */}
      <g opacity={closeU}>
        <rect x={500} y={68} width={280} height={44} rx={6} fill="#0a0e1a" fillOpacity={0.9} />
        <text x={640} y={96} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
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
