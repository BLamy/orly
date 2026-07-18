import { Camera, MathLabel, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, ContourField, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  DENS,
  KL_FINAL,
  KL_WIDE,
  MODES,
  N_ITERS,
  WIDE_Q,
  buildScene,
  klAt,
  kx,
  ky,
  px,
  py,
  thetaAt,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** an ellipse at ±2σ for a diagonal Gaussian */
function qEllipse(
  [mx, my, sx0, sy0]: [number, number, number, number],
  color: string,
  op: number,
  dashed = false,
  key = 'q',
) {
  return (
    <ellipse
      key={key}
      cx={px(mx)}
      cy={py(my)}
      rx={Math.abs(px(mx + 2 * sx0) - px(mx))}
      ry={Math.abs(py(my + 2 * sy0) - py(my))}
      fill={color}
      fillOpacity={0.1 * op}
      stroke={color}
      strokeWidth={2.5}
      strokeDasharray={dashed ? '7 7' : undefined}
      opacity={op}
    />
  );
}

function renderFrame(s: SceneState) {
  const fieldU = s.get(scene.fieldU);
  const qU = s.get(scene.qU);
  const iterT = s.get(scene.iterT);
  const curveU = s.get(scene.curveU);
  const wideU = s.get(scene.wideU);
  const missU = s.get(scene.missU);
  const elboU = s.get(scene.elboU);
  const closeU = s.get(scene.closeU);

  const th = thetaAt(iterT);
  const kl = klAt(iterT);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* the true posterior */}
      <ContourField f={DENS} x={px} y={py} thresholds={9} gridN={90} reveal={fieldU} color={colors.ACCENT} />
      <g opacity={clamp01(fieldU * 3)}>
        <text x={px(MODES[0].x)} y={py(MODES[0].y) - 90} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
          65% of the mass
        </text>
        <text x={px(MODES[1].x)} y={py(MODES[1].y) + 84} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
          35% of the mass
        </text>
      </g>

      {/* q — the moving ellipse */}
      {qEllipse(th, colors.WARM, qU)}
      {/* the hedging alternative */}
      {qEllipse(WIDE_Q, colors.NEGATIVE, wideU, true, 'wide')}
      <g opacity={wideU}>
        <text x={px(0)} y={py(WIDE_Q[3] * 2) - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
          hedge: KL = {KL_WIDE.toFixed(2)}
        </text>
      </g>

      {/* missed-mode marker */}
      <g opacity={missU}>
        <circle cx={px(MODES[1].x)} cy={py(MODES[1].y)} r={54} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 6" />
        <text x={px(MODES[1].x)} y={py(MODES[1].y) - 64} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14}>
          assigned ≈ 0 by q
        </text>
      </g>

      {/* ── the KL curve ── */}
      <g opacity={curveU}>
        <text x={(880 + 1200) / 2} y={214} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          divergence during optimization
        </text>
      </g>
      <Axes x={kx} y={ky} reveal={curveU} xTicks={4} yTicks={4} xLabel="step" yLabel="KL" />
      <FunctionPlot
        x={kx}
        y={ky}
        f={klAt}
        domain={[0, N_ITERS]}
        reveal={curveU * clamp01(iterT / N_ITERS + 0.02)}
        color={colors.WARM}
        width={3}
      />
      {curveU > 0.01 && (
        <g opacity={curveU}>
          <circle cx={kx(Math.min(iterT, N_ITERS))} cy={ky(kl)} r={6} fill={colors.WARM} />
          <text x={kx(Math.min(iterT, N_ITERS))} y={ky(kl) - 14} textAnchor="middle" fill={colors.WARM} fontSize={13}>
            {kl.toFixed(2)}
          </text>
        </g>
      )}
      {/* commit-vs-hedge comparison line */}
      <g opacity={wideU}>
        <line x1={kx(0)} y1={ky(KL_WIDE)} x2={kx(N_ITERS)} y2={ky(KL_WIDE)} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="5 6" />
        <text x={kx(N_ITERS)} y={ky(KL_WIDE) - 10} textAnchor="end" fill={colors.NEGATIVE} fontSize={13}>
          hedging: {KL_WIDE.toFixed(2)}
        </text>
        <text x={kx(N_ITERS)} y={ky(KL_FINAL) - 10} textAnchor="end" fill={colors.WARM} fontSize={13}>
          committing: {KL_FINAL.toFixed(2)}
        </text>
      </g>

      <MathLabel tex="q^* = \arg\min_q \mathrm{KL}(q \,\|\, p)" x={1040} y={600} fontSize={18} color={colors.MUTED} opacity={elboU} />

      <g opacity={closeU}>
        <text x={450} y={90} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
          speed for modes — an explicit trade
        </text>
      </g>
    </Camera>
  );
}

export function ProbVi() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/prob-vi/overrides.json', slug: 'prob-vi' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
