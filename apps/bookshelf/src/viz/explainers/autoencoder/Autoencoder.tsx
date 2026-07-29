import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  DATA,
  LOSS_LAST,
  N_PTS,
  N_STEPS,
  PCA_DIR,
  RUN,
  buildScene,
  lossX,
  lossY,
  recon,
  snapAt,
  xScale,
  yScale,
} from './scene';

/**
 * The Autoencoder — compress, then reconstruct.
 * Pure render: the decoder line, reconstruction segments, and loss curve all
 * replay the RECORDED gradient-descent run in scene.ts; the dashed comparison
 * line is exact principal component analysis.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/autoencoder/overrides.json', slug: 'autoencoder' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function lossPath(upTo: number): string {
  const n = Math.max(1, Math.min(N_STEPS, Math.round(upTo)));
  let d = `M${lossX(0).toFixed(1)} ${lossY(RUN[0].loss).toFixed(1)}`;
  for (let i = 1; i <= n; i++) d += `L${lossX(i).toFixed(1)} ${lossY(RUN[i].loss).toFixed(1)}`;
  return d;
}

/** Bottleneck diagram: 2 -> 1 -> 2 nodes, top-right of the stage. */
function Bottleneck({ u }: { u: number }) {
  if (u <= 0) return null;
  const X0 = 950;
  const Y = 130;
  const layer = (x: number, ys: number[], color: string) =>
    ys.map((y, i) => <circle key={`${x},${i}`} cx={x} cy={y} r={11} fill="none" stroke={color} strokeWidth={2.4} />);
  return (
    <g opacity={u}>
      <text x={X0 + 90} y={Y - 62} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
        encoder · bottleneck · decoder
      </text>
      {layer(X0, [Y - 26, Y + 26], colors.ACCENT)}
      {layer(X0 + 90, [Y], colors.WARM)}
      {layer(X0 + 180, [Y - 26, Y + 26], colors.ACCENT)}
      {[Y - 26, Y + 26].map((y, i) => (
        <line key={i} x1={X0 + 11} y1={y} x2={X0 + 79} y2={Y} stroke={colors.GRID} strokeWidth={1.6} />
      ))}
      {[Y - 26, Y + 26].map((y, i) => (
        <line key={i} x1={X0 + 101} y1={Y} x2={X0 + 169} y2={y} stroke={colors.GRID} strokeWidth={1.6} />
      ))}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const diagU = s.get(scene.diagU);
  const lineU = s.get(scene.lineU);
  const segsU = s.get(scene.segsU);
  const stepProg = s.get(scene.stepProg);
  const lossU = s.get(scene.lossU);
  const pcaU = s.get(scene.pcaU);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const snap = snapAt(stepProg);
  const stepShown = Math.min(N_STEPS, Math.max(0, Math.round(stepProg)));

  // decoder line direction (normalized v), drawn across the data pane
  const vn = Math.hypot(snap.v[0], snap.v[1]) || 1;
  const d0 = snap.v[0] / vn;
  const d1 = snap.v[1] / vn;
  const L = 3.4;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* reconstruction segments — the errors being shrunk */}
          {segsU > 0 &&
            DATA.map((x, i) => {
              const xh = recon(x, snap);
              return (
                <line
                  key={i}
                  x1={xScale(x[0])}
                  y1={yScale(x[1])}
                  x2={xScale(xh[0])}
                  y2={yScale(xh[1])}
                  stroke={colors.NEGATIVE}
                  strokeWidth={1.1}
                  opacity={0.35 * segsU}
                />
              );
            })}

          {/* the data */}
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p[0])}
              cy={yScale(p[1])}
              r={3.4 * clamp01(dotsU * 2 - i / N_PTS)}
              fill={colors.MUTED}
              opacity={0.8}
            />
          ))}

          {/* reconstructions on the line */}
          {segsU > 0 &&
            DATA.map((x, i) => {
              const xh = recon(x, snap);
              return (
                <circle key={i} cx={xScale(xh[0])} cy={yScale(xh[1])} r={2.6} fill={colors.ACCENT} opacity={0.55 * segsU} />
              );
            })}

          {/* the decoder line — the learned 1-D manifold */}
          {lineU > 0 && (
            <line
              x1={xScale(-d0 * L * lineU)}
              y1={yScale(-d1 * L * lineU)}
              x2={xScale(d0 * L * lineU)}
              y2={yScale(d1 * L * lineU)}
              stroke={colors.WARM}
              strokeWidth={3}
              opacity={0.95}
            />
          )}

          {/* exact PCA direction for the payoff */}
          {pcaU > 0 && (
            <line
              x1={xScale(-PCA_DIR[0] * L)}
              y1={yScale(-PCA_DIR[1] * L)}
              x2={xScale(PCA_DIR[0] * L)}
              y2={yScale(PCA_DIR[1] * L)}
              stroke={colors.POSITIVE}
              strokeWidth={2}
              strokeDasharray="9 7"
              opacity={0.85 * pcaU}
            />
          )}

          {/* the loss curve */}
          {lossU > 0 && (
            <g opacity={lossU}>
              <line x1={lossX(0)} y1={lossY(0)} x2={lossX(N_STEPS)} y2={lossY(0)} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={lossX(0)} y1={lossY(0)} x2={lossX(0)} y2={lossY.range()[1]} stroke={colors.GRID} strokeWidth={1.5} />
              <path d={lossPath(stepProg)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.6} />
              <text x={lossX(N_STEPS / 2)} y={lossY(0) + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                step
              </text>
              <text x={lossX(0)} y={lossY.range()[1] - 10} fill={colors.MUTED} fontSize={13}>
                reconstruction loss
              </text>
              {stepProg > N_STEPS - 1 && (
                <text x={lossX(N_STEPS) + 4} y={lossY(LOSS_LAST) + 4} fill={colors.NEGATIVE} fontSize={13}>
                  {LOSS_LAST.toFixed(2)}
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed: bottleneck diagram + math + badge */}
      <Bottleneck u={diagU * dimU} />
      <MathLabel
        tex={'z = \\mathbf{w}\\cdot\\mathbf{x},\\quad \\hat{\\mathbf{x}} = \\mathbf{v}\\,z,\\quad L = \\lVert \\mathbf{x} - \\hat{\\mathbf{x}} \\rVert^2'}
        x={1040}
        y={250}
        fontSize={18}
        opacity={s.get(scene.texU) * dimU}
      />
      {badgeU > 0 && (
        <g opacity={badgeU}>
          <rect x={48} y={584} width={220} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`step ${stepShown} / ${N_STEPS}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Autoencoder
          </text>
          <MathLabel
            tex={'2 \\to 1 \\to 2:\\;\\; \\text{the bottleneck finds the manifold}'}
            x={640}
            y={345}
            fontSize={21}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={400} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`loss 1.88 → ${LOSS_LAST.toFixed(2)} (the noise floor) — the learned line is PCA, rediscovered`}
          </text>
        </g>
      )}
    </>
  );
}

export function Autoencoder() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
