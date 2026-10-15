import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
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

// Left column: the verifier card and the exploit card share one width and one edge.
const CARD_W = 380;
const CARD_X = GATE_X - CARD_W / 2;
const CARD_TOP = GATE_Y - 70;
const CARD_H = 150; // visible tests only; hidden tests grow the card by HIDDEN_GROW
const HIDDEN_GROW = 52;
const BOX_W = 110;
const boxX = (i: number): number => GATE_X - 177 + i * 122;

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
  const wx = chX(Math.min(sweepW, T_STEPS));
  const sx = chX(Math.min(sweepS, T_STEPS));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the verifier gate; the card grows as the hidden tests slide in */}
          <g opacity={gateU}>
            <rect x={CARD_X} y={CARD_TOP} width={CARD_W} height={CARD_H + HIDDEN_GROW * hiddenU} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={GATE_X} y={GATE_Y - 42} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={640}>
              the verifier
            </text>
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={boxX(i)} y={GATE_Y - 20} width={BOX_W} height={34} rx={7} fill={colors.BG} stroke={colors.GRID} />
                <text x={boxX(i) + BOX_W / 2} y={GATE_Y + 2} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                  {`public test ${i + 1}`}
                </text>
              </g>
            ))}
            <text x={GATE_X} y={GATE_Y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              pass all visible tests → reward 1
            </text>
          </g>
          {/* hidden tests */}
          {hiddenU > 0 && (
            <g opacity={hiddenU}>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect x={boxX(i)} y={GATE_Y + 58} width={BOX_W} height={34} rx={7} fill={colors.BG} stroke={colors.WARM} strokeDasharray="4 4" />
                  <text x={boxX(i) + BOX_W / 2} y={GATE_Y + 80} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                    {`hidden ${i + 1}`}
                  </text>
                </g>
              ))}
              <text x={GATE_X} y={GATE_Y + 116} textAnchor="middle" fill={colors.WARM} fontSize={14}>
                held-out inputs the policy has never seen
              </text>
            </g>
          )}
          {/* the exploit card */}
          {cheatU > 0 && (
            <g opacity={cheatU}>
              <rect x={CARD_X} y={GATE_Y + 150} width={CARD_W} height={78} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
              <text x={GATE_X} y={GATE_Y + 178} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={640}>
                strategy 13: memorize the outputs
              </text>
              <text x={GATE_X} y={GATE_Y + 202} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                passes public tests 100% · truly correct 3%
              </text>
            </g>
          )}

          {/* the chart */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(T_STEPS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(1.02)} stroke={colors.GRID} />
              <text x={chX(T_STEPS / 2)} y={CH_Y0 + 28} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                training steps →
              </text>
              <text x={CH_X0 - 18} y={chY(1) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                1.0
              </text>
            </g>
          )}
          {/* weak run: head dots mark where each curve is now, so the start is visible before the sweep */}
          {axU > 0 && (
            <g opacity={weakDim}>
              <path d={runPath(WEAK_RUN, 'verifPass', sweepW)} fill="none" stroke={colors.ACCENT} strokeWidth={3} />
              <path d={runPath(WEAK_RUN, 'truePass', sweepW)} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
              <circle cx={wx} cy={chY(wNow.verifPass)} r={4.5} fill={colors.ACCENT} />
              <circle cx={wx} cy={chY(wNow.truePass)} r={4.5} fill={colors.NEGATIVE} />
              {sweepW > 0 && (
                <>
                  <text x={wx - 10} y={chY(wNow.verifPass) - 10} textAnchor="end" fill={colors.ACCENT} fontSize={14}>
                    {`verifier says: ${(wNow.verifPass * 100).toFixed(1)}%`}
                  </text>
                  <text x={wx - 10} y={chY(wNow.truePass) - 10} textAnchor="end" fill={colors.NEGATIVE} fontSize={14}>
                    {`truth: ${(wNow.truePass * 100).toFixed(1)}%`}
                  </text>
                </>
              )}
              <text x={CH_X0} y={CH_Y0 + 50} fill={colors.MUTED} fontSize={14}>
                {`weak verifier · exploit holds ${(wNow.piCheat * 100).toFixed(0)}% of the policy`}
              </text>
            </g>
          )}
          {/* strong run */}
          {sweepS > 0 && (
            <g>
              <path d={runPath(STRONG_RUN, 'verifPass', sweepS)} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray="7 5" />
              <path d={runPath(STRONG_RUN, 'truePass', sweepS)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={sx} cy={chY(sNow.truePass)} r={4.5} fill={colors.POSITIVE} />
              <text x={sx - 10} y={chY(sNow.truePass) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={14}>
                {`hardened: truth ${(sNow.truePass * 100).toFixed(1)}%`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* closing card: solid panel, so the faded chart behind it does not show through */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={206} width={820} height={236} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The Verifier Is the Attack Surface
          </text>
          <text x={430} y={336} textAnchor="middle" fill={colors.NEGATIVE} fontSize={36} fontWeight={650}>
            {`${(WEAK_FINAL.truePass * 100).toFixed(1)}%`}
          </text>
          <text x={430} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            true correctness, weak verifier
          </text>
          <text x={850} y={336} textAnchor="middle" fill={colors.POSITIVE} fontSize={36} fontWeight={650}>
            {`${(STRONG_FINAL.truePass * 100).toFixed(1)}%`}
          </text>
          <text x={850} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            true correctness, hardened verifier
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
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
