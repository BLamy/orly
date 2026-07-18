import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  INVERSION_RATE,
  LEARNED_N,
  M,
  N_PAIRS,
  PAIRS,
  RULE_X,
  TRUTH,
  WORST_ITEM,
  XS,
  buildScene,
  px,
  py,
} from './scene';

/**
 * Rules vs Learned Preferences — pure render. The learned dots are the real
 * Bradley-Terry fit from scene.ts; the flashes replay the actual noisy pairs.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/rules-vs-preferences/overrides.json',
  slug: 'rules-vs-preferences',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const TRUTH_PATH = XS.map((x, i) => `${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)} ${py(TRUTH[i]).toFixed(1)}`).join('');

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const truthU = s.get(scene.truthU);
  const pairU = s.get(scene.pairU);
  const fitU = s.get(scene.fitU);
  const worstU = s.get(scene.worstU);
  const ruleU = s.get(scene.ruleU);
  const statU = s.get(scene.statU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  // active preference flash
  const pi = Math.min(N_PAIRS - 1, Math.floor(pairU));
  const flash = pairU > 0 && pairU < N_PAIRS ? PAIRS[pi] : null;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* truth curve */}
          {truthU > 0 && (
            <path
              d={TRUTH_PATH}
              fill="none"
              stroke={colors.MUTED}
              strokeWidth={2.5}
              opacity={0.75}
              strokeDasharray="1200"
              strokeDashoffset={1200 * (1 - Math.min(1, truthU))}
            />
          )}
          {truthU > 0.9 && (
            <text x={px(0.03)} y={py(TRUTH[2]) - 18} fill={colors.MUTED} fontSize={13.5} opacity={clamp01((truthU - 0.9) * 10)}>
              true quality (hidden from both methods)
            </text>
          )}

          {/* preference flash */}
          {flash && (
            <g>
              <line x1={px(XS[flash.i])} y1={py(TRUTH[flash.i])} x2={px(XS[flash.j])} y2={py(TRUTH[flash.j])} stroke={flash.flipped ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2} opacity={0.7} />
              <circle cx={px(XS[flash.pref === 1 ? flash.i : flash.j])} cy={py(TRUTH[flash.pref === 1 ? flash.i : flash.j])} r={7} fill="none" stroke={flash.flipped ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2.5} />
            </g>
          )}
          {pairU > 0 && (
            <text x={px(0.02)} y={120} fill={colors.TEXT} fontSize={14}>
              {`preferences collected: ${Math.min(N_PAIRS, Math.floor(pairU))} / ${N_PAIRS}`}
              {flash?.flipped ? '  — this vote is flipped' : ''}
            </text>
          )}

          {/* learned scores */}
          {fitU > 0 &&
            XS.map((x, i) => {
              const u = clamp01(fitU * M * 0.6 - i * 0.5);
              if (u <= 0) return null;
              const worst = i === WORST_ITEM && worstU > 0;
              return (
                <g key={i} opacity={u}>
                  <line x1={px(x)} y1={py(TRUTH[i])} x2={px(x)} y2={py(LEARNED_N[i])} stroke={colors.SECONDARY} strokeWidth={1} opacity={0.4} />
                  <circle
                    cx={px(x)}
                    cy={py(LEARNED_N[i])}
                    r={worst ? 8 : 4.5}
                    fill={worst ? colors.NEGATIVE : colors.SECONDARY}
                    opacity={0.92}
                    stroke={worst ? colors.BG : 'none'}
                    strokeWidth={worst ? 2 : 0}
                  />
                </g>
              );
            })}
          {fitU > 0.9 && (
            <text x={px(0.6)} y={py(LEARNED_N[20]) - 40} fill={colors.SECONDARY} fontSize={13.5} opacity={clamp01((fitU - 0.9) * 10)}>
              the learned reward model
            </text>
          )}
          {worstU > 0.5 && (
            <text x={px(XS[WORST_ITEM]) + 14} y={py(LEARNED_N[WORST_ITEM]) - 12} fill={colors.NEGATIVE} fontSize={13} opacity={worstU}>
              lucky votes
            </text>
          )}

          {/* the rule */}
          {ruleU > 0 && (
            <g opacity={ruleU}>
              <rect x={px(RULE_X)} y={110} width={px(1) - px(RULE_X) + 30} height={470} fill={colors.NEGATIVE} opacity={0.08} />
              <line x1={px(RULE_X)} y1={110} x2={px(RULE_X)} y2={580} stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={px(RULE_X) + 12} y={136} fill={colors.NEGATIVE} fontSize={14} fontWeight={650}>
                the written rule: never past this line
              </text>
              <text x={px(RULE_X) + 12} y={158} fill={colors.MUTED} fontSize={12.5}>
                exact here — silent everywhere else
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* stat panel */}
      {statU > 0 && (
        <g opacity={statU * dimU}>
          <rect x={72} y={92} width={330} height={92} rx={12} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={94} y={124} fill={colors.TEXT} fontSize={15} fontWeight={600}>
            the learned judge, measured
          </text>
          <text x={94} y={154} fill={colors.NEGATIVE} fontSize={14.5}>
            {`${(INVERSION_RATE * 100).toFixed(1)}% of all pairs ranked wrong`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Rules vs Preferences
          </text>
          <MathLabel
            tex={'\\text{rules: exact, partial} \\qquad \\text{preferences: total, noisy}'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.ACCENT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            constitutional training: written principles generate the preference data
          </text>
        </g>
      )}
    </>
  );
}

export function RulesVsPreferences() {
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
