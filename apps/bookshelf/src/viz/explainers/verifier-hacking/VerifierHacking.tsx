import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CH_X0,
  CH_Y0,
  GATE_X,
  GATE_Y,
  STRONG_FINAL,
  STRONG_RUN,
  T_STEPS,
  WEAK_FINAL,
  WEAK_RUN,
  buildScene,
  chX,
  chY,
  snapAt,
} from './scene';
import type { Snap } from './scene';

/**
 * Hacking the Verifier — pure render. Both training runs (weak and hardened
 * verifier) are the real GRPO simulations from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/verifier-hacking/overrides.json',
  slug: 'verifier-hacking',
};

function runPath(run: Snap[], key: 'verifPass' | 'truePass', upTo: number): string {
  const n = Math.max(2, Math.min(T_STEPS + 1, Math.ceil(upTo) + 1));
  let d = '';
  for (let i = 0; i < n; i += 2) {
    d += `${i === 0 ? 'M' : 'L'}${chX(i).toFixed(1)} ${chY(run[i][key]).toFixed(1)}`;
  }
  return d;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gateU = s.get(scene.gateU);
  const cheatU = s.get(scene.cheatU);
  const axU = s.get(scene.axU);
  const sweepW = s.get(scene.sweepW);
  const hiddenU = s.get(scene.hiddenU);
  const sweepS = s.get(scene.sweepS);
  const weakDim = s.get(scene.weakDim);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const wNow = snapAt(WEAK_RUN, sweepW);
  const sNow = snapAt(STRONG_RUN, sweepS);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the verifier gate */}
          <g opacity={gateU}>
            <rect x={GATE_X - 170} y={GATE_Y - 70} width={340} height={150} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={GATE_X} y={GATE_Y - 42} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={640}>
              the verifier
            </text>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={GATE_X - 148 + i * 100} y={GATE_Y - 20} width={92} height={34} rx={7} fill={colors.BG} stroke={colors.GRID} />
                <text x={GATE_X - 102 + i * 100} y={GATE_Y + 2} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {`public test ${i + 1}`}
                </text>
              </g>
            ))}
            <text x={GATE_X} y={GATE_Y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
              pass all visible tests → reward 1
            </text>
          </g>
          {/* hidden tests */}
          {hiddenU > 0 && (
            <g opacity={hiddenU}>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect x={GATE_X - 148 + i * 100} y={GATE_Y + 58} width={92} height={34} rx={7} fill={colors.BG} stroke={colors.WARM} strokeDasharray="4 4" />
                  <text x={GATE_X - 102 + i * 100} y={GATE_Y + 80} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
                    {`hidden ${i + 1}`}
                  </text>
                </g>
              ))}
              <text x={GATE_X} y={GATE_Y + 116} textAnchor="middle" fill={colors.WARM} fontSize={12}>
                held-out inputs the policy has never seen
              </text>
            </g>
          )}
          {/* the exploit card */}
          {cheatU > 0 && (
            <g opacity={cheatU}>
              <rect x={GATE_X - 170} y={GATE_Y + 150} width={340} height={78} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text x={GATE_X} y={GATE_Y + 178} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14.5} fontWeight={640}>
                strategy 13: memorize the outputs
              </text>
              <text x={GATE_X} y={GATE_Y + 202} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                passes public tests 100% · truly correct 3%
              </text>
            </g>
          )}

          {/* the chart */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(T_STEPS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.02)} stroke={colors.GRID} />
              <text x={chX(T_STEPS / 2)} y={CH_Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                training steps →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                1.0
              </text>
            </g>
          )}
          {/* weak run */}
          {sweepW > 0 && (
            <g opacity={weakDim}>
              <path d={runPath(WEAK_RUN, 'verifPass', sweepW)} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
              <path d={runPath(WEAK_RUN, 'truePass', sweepW)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={chX(Math.min(sweepW, T_STEPS)) + 8} y={chY(wNow.verifPass) - 6} fill={colors.ACCENT} fontSize={12.5}>
                {`verifier says: ${(wNow.verifPass * 100).toFixed(1)}%`}
              </text>
              <text x={chX(Math.min(sweepW, T_STEPS)) + 8} y={chY(wNow.truePass) + 18} fill={colors.NEGATIVE} fontSize={12.5}>
                {`truth: ${(wNow.truePass * 100).toFixed(1)}%`}
              </text>
              <text x={CH_X0} y={CH_Y0 + 48} fill={colors.MUTED} fontSize={12.5}>
                {`weak verifier · exploit holds ${(wNow.piCheat * 100).toFixed(0)}% of the policy`}
              </text>
            </g>
          )}
          {/* strong run */}
          {sweepS > 0 && (
            <g>
              <path d={runPath(STRONG_RUN, 'verifPass', sweepS)} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="7 5" />
              <path d={runPath(STRONG_RUN, 'truePass', sweepS)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <text x={chX(Math.min(sweepS, T_STEPS)) - 10} y={chY(sNow.truePass) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13}>
                {`hardened: truth ${(sNow.truePass * 100).toFixed(1)}%`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Verifier Is the Attack Surface
          </text>
          <MathLabel
            tex={`\\text{weak}: ${(WEAK_FINAL.truePass * 100).toFixed(1)}\\%\\ \\text{true} \\qquad \\text{hardened}: ${(STRONG_FINAL.truePass * 100).toFixed(1)}\\%\\ \\text{true}`}
            x={640}
            y={340}
            fontSize={20}
            color={colors.TEXT}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the check must be harder to game than the task is to solve
          </text>
        </g>
      )}
    </>
  );
}

export function VerifierHacking() {
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
