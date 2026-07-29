import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ADV_X,
  CH_X0,
  CH_Y0,
  FINAL,
  G,
  GRP_X,
  HIST,
  K,
  SHOWCASE,
  START,
  T_STEPS,
  buildScene,
  chX,
  chY,
  grpY,
  snapAt,
} from './scene';

/**
 * GRPO at Toy Scale — pure render. The showcased group and the training curve
 * are the real GRPO run from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/grpo-group/overrides.json', slug: 'grpo-group' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function passCurve(upTo: number): string {
  const n = Math.max(2, Math.min(T_STEPS + 1, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i += 2) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(HIST[i].expPass).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const grpU = s.get(scene.grpU);
  const rwU = s.get(scene.rwU);
  const statU = s.get(scene.statU);
  const advU = s.get(scene.advU);
  const axU = s.get(scene.axU);
  const train = s.get(scene.train);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const snap = snapAt(train);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* prompt header */}
          {grpU > 0 && (
            <g opacity={grpU}>
              <rect x={GRP_X - 110} y={64} width={330} height={36} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={GRP_X + 55} y={87} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                one prompt · sample a group of {G}
              </text>
            </g>
          )}

          {/* the group */}
          {SHOWCASE.rs.map((r, i) => {
            const u = clamp01(grpU * 1.6 - i * 0.07);
            if (u <= 0) return null;
            const stamped = clamp01(rwU * 1.6 - i * 0.07);
            const adv = SHOWCASE.advs[i];
            return (
              <g key={i} opacity={u}>
                <rect
                  x={GRP_X - 90}
                  y={grpY(i) - 18}
                  width={200}
                  height={38}
                  rx={8}
                  fill={colors.PANEL}
                  stroke={stamped > 0.5 ? (r ? colors.POSITIVE : colors.NEGATIVE) : colors.GRID}
                  strokeWidth={stamped > 0.5 && r ? 2 : 1.2}
                />
                <text x={GRP_X - 74} y={grpY(i) + 6} fill={colors.MUTED} fontSize={12.5}>
                  {`completion ${i + 1} · strategy ${SHOWCASE.acts[i] + 1}`}
                </text>
                {stamped > 0.3 && (
                  <text x={GRP_X + 128} y={grpY(i) + 6} fill={r ? colors.POSITIVE : colors.NEGATIVE} fontSize={13.5} fontWeight={640} opacity={stamped}>
                    {r ? 'pass · 1' : 'fail · 0'}
                  </text>
                )}
                {/* advantage arrow */}
                {advU > 0 && (
                  <g opacity={advU}>
                    <line
                      x1={ADV_X}
                      y1={grpY(i)}
                      x2={ADV_X + adv * 42}
                      y2={grpY(i)}
                      stroke={adv > 0 ? colors.POSITIVE : colors.NEGATIVE}
                      strokeWidth={3.5}
                      strokeLinecap="round"
                    />
                    <text
                      x={ADV_X + adv * 42 + (adv > 0 ? 10 : -10)}
                      y={grpY(i) + 4.5}
                      textAnchor={adv > 0 ? 'start' : 'end'}
                      fill={adv > 0 ? colors.POSITIVE : colors.NEGATIVE}
                      fontSize={12.5}
                    >
                      {adv > 0 ? `+${adv.toFixed(2)}` : adv.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {advU > 0.4 && (
            <text x={ADV_X + 10} y={grpY(G - 1) + 40} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} opacity={advU}>
              advantage per completion
            </text>
          )}

          {/* group stats */}
          {statU > 0 && (
            <g opacity={statU}>
              <rect x={GRP_X - 110} y={grpY(G - 1) + 52} width={330} height={40} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={GRP_X + 55} y={grpY(G - 1) + 77} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
                {`group mean = ${SHOWCASE.mean.toFixed(3)} · std = ${SHOWCASE.sd.toFixed(3)}`}
              </text>
            </g>
          )}

          {/* training curve */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(T_STEPS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(0.92)} stroke={colors.GRID} />
              <text x={chX(T_STEPS / 2)} y={CH_Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                training steps (groups of 8) →
              </text>
              <line x1={CH_X0 - 8} y1={chY(0.85)} x2={chX(T_STEPS) + 10} y2={chY(0.85)} stroke={colors.GRID} strokeDasharray="4 5" />
              <text x={chX(T_STEPS) - 4} y={chY(0.85) - 8} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                best strategy ceiling 0.85
              </text>
            </g>
          )}
          {train > 0 && (
            <g>
              <path d={passCurve(train)} fill="none" stroke={colors.SECONDARY} strokeWidth={3} />
              <circle cx={chX(Math.min(train, T_STEPS))} cy={chY(snap.expPass)} r={5} fill={colors.SECONDARY} />
              <text x={chX(Math.min(train, T_STEPS)) - 10} y={chY(snap.expPass) - 12} textAnchor="end" fill={colors.SECONDARY} fontSize={13.5}>
                {`pass rate: ${(snap.expPass * 100).toFixed(1)}%`}
              </text>
              <text x={CH_X0} y={CH_Y0 + 50} fill={colors.MUTED} fontSize={12.5}>
                {`step ${Math.round(snap.step)} · no value network`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'A_i = \\dfrac{r_i - \\bar r}{\\sigma_r}'}
        x={1100}
        y={80}
        fontSize={21}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Group-Relative Policy Optimization
          </text>
          <MathLabel
            tex={`A_i = \\tfrac{r_i - \\bar r}{\\sigma_r} \\qquad \\text{pass rate}: ${(START.expPass * 100).toFixed(1)}\\% \\to ${(FINAL.expPass * 100).toFixed(1)}\\%`}
            x={640}
            y={340}
            fontSize={19}
            color={colors.SECONDARY}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the group is the critic — no value network to train
          </text>
        </g>
      )}
    </>
  );
}

export function GrpoGroup() {
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
