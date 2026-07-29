import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_H,
  BAR_W,
  BAR_Y0,
  CH_X0,
  CH_Y0,
  FINAL,
  HIST,
  K,
  LOOP_POLICY,
  LOOP_VERIF,
  P_PASS,
  START,
  T_STEPS,
  buildScene,
  barX,
  chX,
  chY,
  snapAt,
} from './scene';

/**
 * The RLVR Loop — pure render. Bars and curve sample the real REINFORCE run
 * precomputed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/rlvr-loop/overrides.json', slug: 'rlvr-loop' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
/** which of the three showcased attempts pass (deterministic story beats) */
const PKT_PASS = [false, false, true];

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
  const loopU = s.get(scene.loopU);
  const pktU = s.get(scene.pktU);
  const barU = s.get(scene.barU);
  const axU = s.get(scene.axU);
  const train = s.get(scene.train);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const snap = snapAt(train);
  const cyc = Math.min(2, Math.floor(pktU));
  const u = pktU - Math.floor(pktU);
  const pass = PKT_PASS[cyc];
  // packet path: policy → verifier (u 0..0.5), reward back (u 0.5..1)
  const fwd = clamp01(u * 2);
  const back = clamp01(u * 2 - 1);
  const px = LOOP_POLICY.x + (LOOP_VERIF.x - LOOP_POLICY.x) * fwd;
  const bx = LOOP_VERIF.x + (LOOP_POLICY.x - LOOP_VERIF.x) * back;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the loop machine */}
          <g opacity={loopU}>
            {[
              { p: LOOP_POLICY, label: 'policy', sub: 'proposes a solution', c: colors.ACCENT },
              { p: LOOP_VERIF, label: 'verifier', sub: 'runs the test suite', c: colors.POSITIVE },
            ].map((n) => (
              <g key={n.label}>
                <rect x={n.p.x - 78} y={n.p.y - 34} width={156} height={68} rx={12} fill={colors.PANEL} stroke={n.c} strokeWidth={1.5} />
                <text x={n.p.x} y={n.p.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={640}>
                  {n.label}
                </text>
                <text x={n.p.x} y={n.p.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                  {n.sub}
                </text>
              </g>
            ))}
            <path
              d={`M${LOOP_POLICY.x + 82} ${LOOP_POLICY.y - 12} L${LOOP_VERIF.x - 82} ${LOOP_VERIF.y - 12}`}
              stroke={colors.GRID}
              strokeWidth={1.5}
              markerEnd="none"
            />
            <path
              d={`M${LOOP_VERIF.x - 82} ${LOOP_VERIF.y + 12} L${LOOP_POLICY.x + 82} ${LOOP_POLICY.y + 12}`}
              stroke={colors.GRID}
              strokeWidth={1.5}
            />
            <text x={(LOOP_POLICY.x + LOOP_VERIF.x) / 2} y={LOOP_POLICY.y - 24} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              attempt →
            </text>
            <text x={(LOOP_POLICY.x + LOOP_VERIF.x) / 2} y={LOOP_POLICY.y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              ← reward: pass = 1 · fail = 0
            </text>
          </g>
          {pktU > 0 && pktU < 3 && (
            <g>
              {fwd > 0 && back <= 0 && (
                <circle cx={px} cy={LOOP_POLICY.y - 12} r={7} fill={colors.ACCENT} />
              )}
              {back > 0 && (
                <circle cx={bx} cy={LOOP_POLICY.y + 12} r={7} fill={pass ? colors.POSITIVE : colors.NEGATIVE} />
              )}
              {back > 0 && (
                <text x={bx} y={LOOP_POLICY.y + 44} textAnchor="middle" fill={pass ? colors.POSITIVE : colors.NEGATIVE} fontSize={13}>
                  {pass ? 'pass · r = 1' : 'fail · r = 0'}
                </text>
              )}
            </g>
          )}

          {/* policy bars */}
          <g opacity={barU}>
            {snap.pi.map((p, i) => {
              const h = p * BAR_H * 3.2;
              const best = i === K - 1;
              return (
                <g key={i}>
                  <rect
                    x={barX(i)}
                    y={BAR_Y0 - Math.min(h, BAR_H)}
                    width={BAR_W}
                    height={Math.min(h, BAR_H)}
                    rx={3}
                    fill={best ? colors.POSITIVE : colors.ACCENT}
                    opacity={best ? 0.95 : 0.55}
                  />
                  <text x={barX(i) + BAR_W / 2} y={BAR_Y0 + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
                    {`${Math.round(P_PASS[i] * 100)}%`}
                  </text>
                </g>
              );
            })}
            <text x={barX(0)} y={BAR_Y0 - BAR_H - 14} fill={colors.MUTED} fontSize={13}>
              policy over 12 strategies (labels: true pass rate)
            </text>
            <text x={barX(0)} y={BAR_Y0 + 38} fill={colors.MUTED} fontSize={12.5}>
              {`step ${Math.round(snap.step)} · mass on best: ${(snap.pi[K - 1] * 100).toFixed(0)}%`}
            </text>
          </g>

          {/* training curve */}
          {axU > 0 && (
            <g opacity={axU}>
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={chX(T_STEPS) + 10} y2={CH_Y0} stroke={colors.GRID} />
              <line x1={CH_X0 - 8} y1={CH_Y0} x2={CH_X0 - 8} y2={chY(0.92)} stroke={colors.GRID} />
              <text x={chX(T_STEPS / 2)} y={CH_Y0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                training steps →
              </text>
              <text x={CH_X0 - 18} y={chY(0.85) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                0.85
              </text>
              <line x1={CH_X0 - 8} y1={chY(0.85)} x2={chX(T_STEPS) + 10} y2={chY(0.85)} stroke={colors.GRID} strokeDasharray="4 5" />
              <text x={chX(T_STEPS) - 4} y={chY(0.85) - 8} textAnchor="end" fill={colors.MUTED} fontSize={11.5}>
                best strategy ceiling
              </text>
            </g>
          )}
          {train > 0 && (
            <g>
              <path d={passCurve(train)} fill="none" stroke={colors.POSITIVE} strokeWidth={3} />
              <circle cx={chX(Math.min(train, T_STEPS))} cy={chY(snap.expPass)} r={5} fill={colors.POSITIVE} />
              <text x={chX(Math.min(train, T_STEPS)) - 10} y={chY(snap.expPass) - 12} textAnchor="end" fill={colors.POSITIVE} fontSize={13.5}>
                {`pass rate: ${(snap.expPass * 100).toFixed(1)}%`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'\\nabla J = \\mathbb{E}\\big[(r-\\bar r)\\,\\nabla_{\\theta} \\log \\pi_{\\theta}(a)\\big]'}
        x={985}
        y={70}
        fontSize={18}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            The RLVR Loop
          </text>
          <MathLabel
            tex={`\\text{pass rate}: ${(START.expPass * 100).toFixed(1)}\\% \\to ${(FINAL.expPass * 100).toFixed(1)}\\%`}
            x={640}
            y={340}
            fontSize={20}
            color={colors.POSITIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            propose → execute → reinforce: reward only for passing
          </text>
        </g>
      )}
    </>
  );
}

export function RlvrLoop() {
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
