import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_BASE,
  BEST_I,
  FRAMES,
  N,
  N_PAIRS,
  QUALITY,
  UNIFORM_Q,
  accX,
  accY,
  barX,
  buildScene,
  frameAt,
  polScale,
  qY,
  rewardScale,
} from './scene';

/**
 * RLHF — aligning a model with a preference loop.
 * Pure render: the reward bars, policy bars, ranking-accuracy curve, and
 * average-quality curve all replay the RECORDED preference-learning run in
 * scene.ts (Bradley-Terry preferences, reward model, softmax policy).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/rlhf/overrides.json', slug: 'rlhf' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function accPath(upTo: number): string {
  const n = Math.max(1, Math.min(N_PAIRS - 1, Math.round(upTo)));
  let d = `M${accX(0).toFixed(1)} ${accY(FRAMES[0].acc).toFixed(1)}`;
  for (let i = 10; i <= n; i += 10) d += `L${accX(i).toFixed(1)} ${accY(FRAMES[i].acc).toFixed(1)}`;
  return d;
}
function qPath(upTo: number): string {
  const n = Math.max(1, Math.min(N_PAIRS - 1, Math.round(upTo)));
  let d = `M${accX(0).toFixed(1)} ${qY(FRAMES[0].avgQ).toFixed(1)}`;
  for (let i = 10; i <= n; i += 10) d += `L${accX(i).toFixed(1)} ${qY(FRAMES[i].avgQ).toFixed(1)}`;
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const respU = s.get(scene.respU);
  const compU = s.get(scene.compU);
  const rmU = s.get(scene.rmU);
  const prog = s.get(scene.prog);
  const polU = s.get(scene.polU);
  const curvesU = s.get(scene.curvesU);
  const truthU = s.get(scene.truthU);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const fr = frameAt(prog);
  const compShown = Math.min(N_PAIRS, Math.max(0, Math.round(prog)));
  const comp = fr.comp;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the eight candidate responses (labels) */}
          {respU > 0 &&
            Array.from({ length: N }, (_, i) => {
              const u = clamp01(respU * 2 - i / N);
              if (u <= 0) return null;
              const inComp = compU > 0.5 && (i === comp.win || i === comp.lose);
              const win = i === comp.win;
              return (
                <g key={i} opacity={u}>
                  <rect
                    x={barX(i) - 40}
                    y={110}
                    width={80}
                    height={44}
                    rx={8}
                    fill={colors.PANEL}
                    stroke={inComp ? (win ? colors.POSITIVE : colors.NEGATIVE) : colors.GRID}
                    strokeWidth={inComp ? 2.6 : 1.2}
                  />
                  <text x={barX(i)} y={137} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {`answer ${String.fromCharCode(65 + i)}`}
                  </text>
                  {inComp && (
                    <text x={barX(i)} y={100} textAnchor="middle" fill={win ? colors.POSITIVE : colors.NEGATIVE} fontSize={13}>
                      {win ? 'preferred' : 'rejected'}
                    </text>
                  )}
                </g>
              );
            })}

          {/* baseline for the bars */}
          <line x1={barX(0) - 60} y1={BAR_BASE} x2={barX(N - 1) + 60} y2={BAR_BASE} stroke={colors.GRID} strokeWidth={1.4} opacity={rmU} />

          {/* reward-model bars (up = good) and policy bars (down = probability) */}
          {Array.from({ length: N }, (_, i) => {
            const rH = rewardScale(Math.abs(fr.reward[i]));
            const rUp = fr.reward[i] >= 0;
            const pol = fr.policy[i];
            return (
              <g key={i}>
                {rmU > 0 && (
                  <rect
                    x={barX(i) - 24}
                    y={rUp ? BAR_BASE - rH : BAR_BASE}
                    width={20}
                    height={rH}
                    rx={4}
                    fill={rUp ? colors.WARM : colors.NEGATIVE}
                    opacity={0.85 * rmU}
                  />
                )}
                {polU > 0 && (
                  <rect
                    x={barX(i) + 4}
                    y={BAR_BASE - polScale(pol)}
                    width={20}
                    height={polScale(pol)}
                    rx={4}
                    fill={colors.ACCENT}
                    opacity={0.85 * polU}
                  />
                )}
                {/* true quality tick (revealed at end) */}
                {truthU > 0 && (
                  <g opacity={truthU}>
                    <line
                      x1={barX(i) - 30}
                      x2={barX(i) + 30}
                      y1={BAR_BASE - rewardScale(QUALITY[i] * 1.6)}
                      y2={BAR_BASE - rewardScale(QUALITY[i] * 1.6)}
                      stroke={i === BEST_I ? colors.POSITIVE : colors.TEXT}
                      strokeWidth={i === BEST_I ? 2.6 : 1.6}
                      strokeDasharray="5 4"
                      opacity={0.8}
                    />
                  </g>
                )}
              </g>
            );
          })}
          {rmU > 0 && (
            <text x={barX(0) - 44} y={BAR_BASE - 130} fill={colors.WARM} fontSize={13} opacity={rmU}>
              reward
            </text>
          )}
          {polU > 0 && (
            <text x={barX(N - 1) + 30} y={BAR_BASE - 130} fill={colors.ACCENT} fontSize={13} opacity={polU} textAnchor="end">
              policy odds
            </text>
          )}
          {truthU > 0 && (
            <text x={barX(0) - 44} y={BAR_BASE - 156} fill={colors.POSITIVE} fontSize={13} opacity={truthU}>
              true quality
            </text>
          )}

          {/* the accuracy + quality curves */}
          {curvesU > 0 && (
            <g opacity={curvesU}>
              <line x1={accX(0)} y1={accY(0)} x2={accX(0)} y2={qY(QUALITY[BEST_I])} stroke={colors.GRID} strokeWidth={1.2} />
              <path d={accPath(prog)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
              <path d={qPath(prog)} fill="none" stroke={colors.ACCENT} strokeWidth={2.4} />
              <text x={accX(N_PAIRS / 2)} y={accY(0) + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                comparisons seen
              </text>
              <text x={accX(N_PAIRS) - 4} y={accY(fr.acc) - 8} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                {`judge accuracy ${(fr.acc * 100).toFixed(0)}%`}
              </text>
              <text x={accX(N_PAIRS) - 4} y={qY(fr.avgQ) - 8} textAnchor="end" fill={colors.ACCENT} fontSize={13}>
                {`avg quality ${fr.avgQ.toFixed(2)}`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math + badge */}
      <MathLabel tex={'P(a \\succ b) = \\sigma\\big(r(a) - r(b)\\big)'} x={1010} y={64} fontSize={20} opacity={s.get(scene.texU) * dimU} />
      {badgeU > 0 && (
        <g opacity={badgeU * dimU}>
          <rect x={48} y={584} width={280} height={38} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={609} fill={colors.TEXT} fontSize={15}>
            {`human comparisons: ${compShown} / ${N_PAIRS}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={232} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Learning from Human Feedback
          </text>
          <MathLabel tex={'\\text{compare} \\to \\text{reward model} \\to \\text{reinforce}'} x={640} y={338} fontSize={21} color={colors.WARM} opacity={endU} />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`avg quality ${UNIFORM_Q.toFixed(2)} → ${FRAMES[N_PAIRS - 1].avgQ.toFixed(2)} from comparisons alone — and it inherits every proxy hazard`}
          </text>
        </g>
      )}
    </>
  );
}

export function Rlhf() {
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
