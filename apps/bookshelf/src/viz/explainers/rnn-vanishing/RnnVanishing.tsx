import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_H,
  BAR_Y0,
  CELL_W,
  CHAIN_Y,
  FINAL_GRAD,
  FINAL_GRAD_BIG,
  GRADS,
  GRADS_BIG,
  HS,
  T_STEPS,
  buildScene,
  cellX,
} from './scene';

/**
 * RNNs and the Vanishing Gradient — pure render.
 * The chain states, gradient bars, and knife-edge curves all come from the
 * exact recurrent run and Jacobian products computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/rnn-vanishing/overrides.json', slug: 'rnn-vanishing' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/** log-scale bar height: 1 → full, 1e-9 → 0. */
const LOG_FLOOR = 9;
const barH = (g: number): number =>
  BAR_H * clamp01(1 + Math.log10(Math.max(g, 1e-12)) / LOG_FLOOR);

// closed-form knife-edge curves for the inset
const KNIFE: { k: number; lo: number; hi: number }[] = Array.from({ length: 21 }, (_, k) => ({
  k,
  lo: Math.pow(0.9, k),
  hi: Math.pow(1.1, k),
}));

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const chainU = s.get(scene.chainU);
  const flowU = s.get(scene.flowU);
  const gradU = s.get(scene.gradU);
  const bigU = s.get(scene.bigU);
  const curveU = s.get(scene.curveU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const flowI = Math.floor(Math.min(T_STEPS, flowU));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the unrolled chain */}
          {Array.from({ length: T_STEPS + 1 }, (_, t) => {
            const u = clamp01(chainU * (T_STEPS + 3) - t);
            if (u <= 0) return null;
            const lit = flowU >= t && flowU > 0;
            const h = HS[t];
            return (
              <g key={t} opacity={u}>
                {t > 0 && (
                  <line
                    x1={cellX(t - 1) + 17}
                    y1={CHAIN_Y}
                    x2={cellX(t) - 17}
                    y2={CHAIN_Y}
                    stroke={lit ? colors.ACCENT : colors.GRID}
                    strokeWidth={2}
                  />
                )}
                <circle
                  cx={cellX(t)}
                  cy={CHAIN_Y}
                  r={15}
                  fill={lit ? colors.PANEL : colors.BG}
                  stroke={lit ? colors.ACCENT : colors.GRID}
                  strokeWidth={2}
                />
                {/* the state value fills the cell as the packet passes */}
                {lit && (
                  <circle
                    cx={cellX(t)}
                    cy={CHAIN_Y}
                    r={11 * Math.min(1, Math.abs(h) + 0.15)}
                    fill={h >= 0 ? colors.ACCENT : colors.SECONDARY}
                    opacity={0.75}
                  />
                )}
                {(t === 0 || t === T_STEPS || t % 5 === 0) && (
                  <text x={cellX(t)} y={CHAIN_Y - 26} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    {`t=${t}`}
                  </text>
                )}
              </g>
            );
          })}
          {/* forward packet */}
          {flowU > 0 && flowU < T_STEPS && (
            <circle cx={cellX(flowU)} cy={CHAIN_Y} r={7} fill={colors.WARM} />
          )}
          <text x={cellX(0) - 8} y={CHAIN_Y + 44} fill={colors.MUTED} fontSize={13} opacity={chainU}>
            inputs enter below each cell
          </text>

          {/* gradient bars — sweep RIGHT to LEFT (blame travels backward) */}
          {gradU > 0 &&
            Array.from({ length: T_STEPS + 1 }, (_, d) => {
              // d steps back from the end → drawn at column T-d
              const u = clamp01(gradU - d + 1);
              if (u <= 0) return null;
              const t = T_STEPS - d;
              const g = GRADS[d];
              const h = barH(g) * u;
              const hBig = barH(GRADS_BIG[d]) * u * bigU;
              return (
                <g key={d}>
                  <rect
                    x={cellX(t) - 14}
                    y={BAR_Y0 - h}
                    width={bigU > 0 ? 12 : 28}
                    height={Math.max(1.5, h)}
                    rx={3}
                    fill={colors.ACCENT}
                    opacity={0.85}
                  />
                  {bigU > 0 && (
                    <rect
                      x={cellX(t) + 1}
                      y={BAR_Y0 - Math.max(1.5, hBig)}
                      width={12}
                      height={Math.max(1.5, hBig)}
                      rx={3}
                      fill={colors.NEGATIVE}
                      opacity={0.85 * bigU}
                    />
                  )}
                </g>
              );
            })}
          {gradU > 0 && (
            <g>
              <line x1={cellX(0) - 22} y1={BAR_Y0} x2={cellX(T_STEPS) + 22} y2={BAR_Y0} stroke={colors.GRID} />
              <text x={cellX(0) - 22} y={BAR_Y0 + 24} fill={colors.MUTED} fontSize={13}>
                {`gradient reaching each step (log scale) — w = 0.9`}
              </text>
              {gradU >= T_STEPS - 0.5 && (
                <text x={cellX(0)} y={BAR_Y0 - barH(FINAL_GRAD) - 10} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>
                  {FINAL_GRAD.toFixed(4)}
                </text>
              )}
              {bigU > 0 && (
                <text x={cellX(4)} y={BAR_Y0 + 24} fill={colors.NEGATIVE} fontSize={13} opacity={bigU}>
                  {`w = 1.6 saturates: ${FINAL_GRAD_BIG.toExponential(1)} at step 0`}
                </text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed: the Jacobian product */}
      <MathLabel
        tex={'\\left|\\frac{\\partial h_{20}}{\\partial h_0}\\right| = \\prod_{k=1}^{20} \\left|w\\,(1-h_k^2)\\right| \\approx 0.008'}
        x={985}
        y={92}
        fontSize={20}
        color={colors.WARM}
        opacity={s.get(scene.jacU)}
      />

      {/* knife-edge inset: 0.9^k vs 1.1^k */}
      {curveU > 0 && (
        <g opacity={curveU * dimU}>
          <rect x={950} y={330} width={280} height={190} rx={12} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
          {(['lo', 'hi'] as const).map((key) => {
            const pts = KNIFE.map((p) => {
              const v = p[key];
              const y = 505 - Math.min(1, v / 7) * 160;
              return `${965 + p.k * 12.5},${y}`;
            });
            return (
              <polyline
                key={key}
                points={pts.slice(0, Math.max(2, Math.ceil(curveU * 21))).join(' ')}
                fill="none"
                stroke={key === 'lo' ? colors.ACCENT : colors.NEGATIVE}
                strokeWidth={2.5}
              />
            );
          })}
          <text x={1090} y={352} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
            the knife edge
          </text>
          <text x={1170} y={375} fill={colors.NEGATIVE} fontSize={12}>
            1.1ᵏ
          </text>
          <text x={1170} y={495} fill={colors.ACCENT} fontSize={12}>
            0.9ᵏ
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Vanishing Gradient
          </text>
          <MathLabel
            tex={'\\prod_{k} w\\,(1-h_k^2) \\to 0'}
            x={640}
            y={340}
            fontSize={22}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            twenty steps back, under one percent of the learning signal survives
          </text>
        </g>
      )}
    </>
  );
}

export function RnnVanishing() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
