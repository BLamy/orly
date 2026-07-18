import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';
import {
  ARM_X,
  ARM_Y,
  BAR_H,
  BAR_W,
  BAR_Y0,
  EPS_RUN,
  GREEDY_RUN,
  P,
  REGRET_EPS_FINAL,
  REGRET_GREEDY_FINAL,
  REGRET_UCB_FINAL,
  T_TOTAL,
  UCB_RUN,
  buildScene,
  regretX,
  regretY,
  snapAt,
} from './scene';
import type { Snap } from './scene';

/**
 * The Bandit — explore or exploit.
 * Pure render: the machines, the estimate bars, and both regret curves are
 * closed-form functions of the sampled channels plus the recorded runs in
 * scene.ts (real epsilon-greedy, greedy-only, and UCB1 simulations).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/bandit/overrides.json', slug: 'bandit' };

const ARM_COLORS = [colors.SECONDARY, colors.WARM, colors.ACCENT];

function regretPath(run: Snap[], u: number): string {
  const n = Math.max(2, Math.round(u * T_TOTAL));
  let d = `M${regretX(0).toFixed(1)} ${regretY(0).toFixed(1)}`;
  for (let t = 10; t < n; t += 10) {
    d += `L${regretX(t).toFixed(1)} ${regretY(run[Math.min(t, T_TOTAL - 1)].regret).toFixed(1)}`;
  }
  return d;
}

function Machine({ i, snap, u, dim }: { i: number; snap: Snap; u: number; dim: number }) {
  const x = ARM_X[i];
  const est = snap.counts[i] > 0 ? snap.est[i] : 0;
  const h = BAR_H * est;
  return (
    <g opacity={u * dim}>
      {/* the machine */}
      <rect x={x - 62} y={ARM_Y - 46} width={124} height={92} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <circle cx={x} cy={ARM_Y - 8} r={17} fill="none" stroke={ARM_COLORS[i]} strokeWidth={3} />
      <text x={x} y={ARM_Y + 30} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
        {`machine ${['A', 'B', 'C'][i]}`}
      </text>
      {/* estimate bar */}
      <rect x={x - BAR_W / 2} y={BAR_Y0 - BAR_H} width={BAR_W} height={BAR_H} rx={8} fill={colors.PANEL} opacity={0.55} />
      <rect x={x - BAR_W / 2} y={BAR_Y0 - h} width={BAR_W} height={Math.max(0, h)} rx={8} fill={ARM_COLORS[i]} opacity={0.8} />
      <text x={x} y={BAR_Y0 - h - 10} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
        {snap.counts[i] > 0 ? est.toFixed(2) : '—'}
      </text>
      <text x={x} y={BAR_Y0 + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
        {`${snap.counts[i]} pulls`}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const armsU = s.get(scene.armsU);
  const trueU = s.get(scene.trueU);
  const barsU = s.get(scene.barsU);
  const chartU = s.get(scene.chartU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);
  const greedyMode = s.get(scene.greedyMode);

  const run = greedyMode > 0.5 ? GREEDY_RUN : EPS_RUN;
  const prog = greedyMode > 0.5 ? s.get(scene.greedyProg) : s.get(scene.pullProg);
  const snap = snapAt(run, prog);
  const stepShown = Math.min(T_TOTAL, Math.floor(prog) + 1);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the three machines and their belief bars */}
          {[0, 1, 2].map((i) => (
            <Machine key={i} i={i} snap={snap} u={Math.min(1, armsU * 1.6 - i * 0.25)} dim={1} />
          ))}

          {/* the arm just pulled: a halo on the machine + a coin result */}
          {barsU > 0.9 && prog > 0.5 && (
            <g>
              <circle
                cx={ARM_X[snap.arm]}
                cy={ARM_Y - 8}
                r={24}
                fill="none"
                stroke={snap.reward ? colors.POSITIVE : colors.NEGATIVE}
                strokeWidth={2.5}
                opacity={0.9}
              />
              <text
                x={ARM_X[snap.arm]}
                y={ARM_Y - 62}
                textAnchor="middle"
                fill={snap.reward ? colors.POSITIVE : colors.NEGATIVE}
                fontSize={16}
              >
                {snap.reward ? 'win' : 'miss'}
              </text>
            </g>
          )}

          {/* pull counter */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <rect x={60} y={584} width={210} height={38} rx={9} fill={colors.PANEL} opacity={0.85} stroke={colors.GRID} />
              <text x={78} y={609} fill={colors.TEXT} fontSize={15}>
                {`turn ${stepShown} / ${T_TOTAL}`}
              </text>
            </g>
          )}

          {/* the hidden truth: dashed marks at the real payout rates */}
          {trueU > 0 &&
            P.map((p, i) => (
              <g key={i} opacity={trueU}>
                <line
                  x1={ARM_X[i] - BAR_W / 2 - 12}
                  x2={ARM_X[i] + BAR_W / 2 + 12}
                  y1={BAR_Y0 - BAR_H * p}
                  y2={BAR_Y0 - BAR_H * p}
                  stroke={colors.TEXT}
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  opacity={0.75}
                />
                <text x={ARM_X[i] + BAR_W / 2 + 18} y={BAR_Y0 - BAR_H * p + 5} fill={colors.MUTED} fontSize={13}>
                  {p.toFixed(2)}
                </text>
              </g>
            ))}

          {/* the regret chart */}
          {chartU > 0 && (
            <g opacity={chartU}>
              <Axes x={regretX} y={regretY} reveal={chartU} grid xTicks={4} yTicks={4} opacity={0.5} xLabel="turns" yLabel="regret" />
              <path d={regretPath(GREEDY_RUN, s.get(scene.greedyCurveU))} fill="none" stroke={colors.NEGATIVE} strokeWidth={3} opacity={s.get(scene.greedyCurveU) > 0 ? 0.9 : 0} />
              <path d={regretPath(EPS_RUN, s.get(scene.epsCurveU))} fill="none" stroke={colors.WARM} strokeWidth={3} opacity={s.get(scene.epsCurveU) > 0 ? 0.9 : 0} />
              <path d={regretPath(UCB_RUN, s.get(scene.ucbCurveU))} fill="none" stroke={colors.ACCENT} strokeWidth={3} opacity={s.get(scene.ucbCurveU) > 0 ? 0.9 : 0} />
              {s.get(scene.greedyCurveU) > 0.98 && (
                <text x={regretX(T_TOTAL) + 6} y={regretY(REGRET_GREEDY_FINAL) + 4} fill={colors.NEGATIVE} fontSize={14}>greedy</text>
              )}
              {s.get(scene.epsCurveU) > 0.98 && (
                <text x={regretX(T_TOTAL) + 6} y={regretY(REGRET_EPS_FINAL) + 4} fill={colors.WARM} fontSize={14}>ε-greedy</text>
              )}
              {s.get(scene.ucbCurveU) > 0.98 && (
                <text x={regretX(T_TOTAL) + 6} y={regretY(REGRET_UCB_FINAL) + 4} fill={colors.ACCENT} fontSize={14}>UCB</text>
              )}
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed math (top-right) */}
      <MathLabel
        tex={'\\text{score}_a = \\hat\\mu_a + c\\sqrt{\\tfrac{\\ln t}{n_a}}'}
        x={1040}
        y={70}
        fontSize={21}
        color={colors.ACCENT}
        opacity={s.get(scene.ucbTexU)}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={220} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={285} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Explore or Exploit
          </text>
          <text x={640} y={335} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`regret after ${T_TOTAL} turns — greedy ${REGRET_GREEDY_FINAL.toFixed(0)} · ε-greedy ${REGRET_EPS_FINAL.toFixed(0)} · UCB ${REGRET_UCB_FINAL.toFixed(0)}`}
          </text>
          <text x={640} y={385} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            exploration is a budget, not a bug
          </text>
        </g>
      )}
    </>
  );
}

export function Bandit() {
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
