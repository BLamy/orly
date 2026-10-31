import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, ContourField, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  ACC_RATE,
  BIN_X0,
  BIN_X1,
  BURN,
  CHAIN,
  DENS,
  N_BINS,
  buildScene,
  chainAt,
  histAt,
  hx,
  hy,
  px,
  py,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const BIN_W = (BIN_X1 - BIN_X0) / N_BINS;
/** expected fraction of samples per bin under the true x-marginal N(0, 2²) */
const trueFrac = (x: number) => (BIN_W * Math.exp(-0.5 * ((x * x) / 4))) / (2 * Math.sqrt(2 * Math.PI));

/** decimated trail path between chain indices [a, b] */
function trailPath(a: number, b: number): string {
  const pts: string[] = [];
  for (let i = a; i <= b; i += 5) pts.push(`${px(CHAIN[i].x)},${py(CHAIN[i].y)}`);
  return pts.length > 1 ? `M ${pts.join(' L ')}` : '';
}

function renderFrame(s: SceneState) {
  const fieldU = s.get(scene.fieldU);
  const walkerU = s.get(scene.walkerU);
  const t = Math.max(0, Math.min(CHAIN.length - 1, s.get(scene.t)));
  const burnU = s.get(scene.burnU);
  const histU = s.get(scene.histU);
  const trueU = s.get(scene.trueU);
  const statU = s.get(scene.statU);
  const closeU = s.get(scene.closeU);

  const ti = Math.floor(t);
  const pos = chainAt(t);
  const hist = histAt(t);

  // closing beat: the chain and landscape recede so the closing formula reads alone
  const recede = clamp01(closeU);
  return (
    <>
    <Camera {...s.get(scene.cam)}>
      {/* the posterior landscape */}
      <g opacity={1 - 0.75 * recede}>
        <ContourField f={DENS} x={px} y={py} thresholds={9} gridN={90} reveal={fieldU} color={colors.ACCENT} />
      </g>

      {/* burn-in trail (red) and mixing trail (blue); thinned so the banana stays readable */}
      <g opacity={1 - 0.85 * recede}>
        {ti > 5 && (
          <path d={trailPath(0, Math.min(ti, BURN))} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.2} opacity={burnU > 0.02 ? 0.45 : 0.3} />
        )}
        {ti > BURN + 5 && (
          <path d={trailPath(BURN, ti)} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.35} />
        )}

        {/* the walker */}
        <circle cx={px(pos.x)} cy={py(pos.y)} r={8 * walkerU} fill={colors.WARM} stroke="#0a0e1a" strokeWidth={1.5} />
      </g>

      {/* ── the marginal histogram ── */}
      <g opacity={histU}>
        <text x={(880 + 1200) / 2} y={196} textAnchor="middle" fill={colors.TEXT} fillOpacity={0.85} fontSize={14}>
          where the walker slept · x marginal
        </text>
        <line x1={870} y1={560} x2={1210} y2={560} stroke={colors.GRID} strokeWidth={1.5} />
        {hist.map((v, b) => {
          const x0 = BIN_X0 + b * BIN_W;
          return (
            <rect
              key={b}
              x={hx(x0) + 1}
              y={hy(v)}
              width={hx(x0 + BIN_W) - hx(x0) - 2}
              height={Math.max(0, 560 - hy(v))}
              fill={colors.ACCENT}
              fillOpacity={0.75}
            />
          );
        })}
      </g>
      <FunctionPlot x={hx} y={hy} f={trueFrac} domain={[BIN_X0, BIN_X1]} reveal={trueU} color={colors.WARM} width={2.5} />
      <g opacity={trueU}>
        <text x={1150} y={250} textAnchor="end" fill={colors.WARM} fontSize={14}>
          true marginal
        </text>
      </g>

      {/* acceptance stat */}
      <g opacity={statU}>
        <rect x={880} y={584} width={320} height={36} rx={9} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={1040} y={608} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
          accepted {(ACC_RATE * 100).toFixed(0)}% of 6,000 proposals
        </text>
      </g>
    </Camera>

    {/* screen-fixed HUD: stays on the stage while the camera pans to the walker */}
    <text x={450} y={88} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={clamp01(fieldU * 3)}>
      unnormalized posterior p(θ) — plausibility only, no formula for the shape
    </text>
    <g opacity={burnU}>
      <text x={90} y={150} fill={colors.NEGATIVE} fontSize={14}>
        burn in — discard
      </text>
    </g>
    <g opacity={walkerU}>
      <text x={90} y={620} fill={colors.TEXT} fillOpacity={0.85} fontSize={15} fontFamily="ui-monospace, Menlo, monospace">
        step {ti.toLocaleString('en-US')}
      </text>
    </g>
    <g opacity={closeU}>
      <rect x={300} y={574} width={300} height={44} rx={10} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
      <MathLabel tex="\text{time spent} \propto \text{probability}" x={450} y={596} fontSize={19} color={colors.TEXT} />
    </g>
    </>
  );
}

export function ProbMcmc() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/prob-mcmc/overrides.json', slug: 'prob-mcmc' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
