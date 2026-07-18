import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  A_MAX,
  A_MIN,
  CURVE,
  GAP_CEIL,
  GAP_MID,
  LEAK_DOTS,
  N_PLOT,
  PX0,
  PX1,
  PY0,
  buildScene,
  px,
  py,
  score,
} from './scene';

/**
 * The Three Ways Evals Die — pure render. The saturation curve and both
 * quoted gaps (13.3 pts mid-curve, 0.7 pts at the ceiling) come from the
 * seeded 300-item benchmark computed in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/eval-death-modes/overrides.json', slug: 'eval-death-modes' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const CURVE_PATH = CURVE.map((v, i) => {
  const a = A_MIN + ((A_MAX - A_MIN) * i) / (N_PLOT - 1);
  return `${i === 0 ? 'M' : 'L'}${px(a).toFixed(1)},${py(v).toFixed(1)}`;
}).join(' ');

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const curveU = s.get(scene.curveU);
  const aA = s.get(scene.probeA);
  const probeU = s.get(scene.probeU);
  const leakStageU = s.get(scene.leakStageU);
  const leakDriftU = s.get(scene.leakDriftU);
  const canaryU = s.get(scene.canaryU);
  const goodU = s.get(scene.goodU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const aB = aA + 0.5;
  const sA = score(aA);
  const sB = score(aB);
  const gapPts = 100 * (sB - sA);
  const curveOpacity = (1 - leakStageU) * (1 - goodU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimU * curveOpacity}>
          {/* axes */}
          <g opacity={curveU}>
            <line x1={PX0} y1={PY0} x2={PX1} y2={PY0} stroke={colors.GRID} />
            <text x={PX1} y={PY0 + 26} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
              model ability →
            </text>
            <text x={PX0 - 14} y={py(1) - 8} textAnchor="end" fill={colors.MUTED} fontSize={13.5}>
              expected score
            </text>
            {[0, 0.5, 1].map((v) => (
              <text key={v} x={PX0 - 12} y={py(v) + 5} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                {Math.round(v * 100)}
              </text>
            ))}
            <line x1={PX0} y1={py(1)} x2={PX1} y2={py(1)} stroke={colors.GRID} strokeDasharray="4 8" opacity={0.6} />
            <text x={PX0 + 6} y={py(0) - 8} fill={colors.MUTED} fontSize={12.5}>
              300 seeded items · score = mean σ(1.7(a−b))
            </text>
          </g>
          <path d={CURVE_PATH} fill="none" stroke={colors.ACCENT} strokeWidth={3} strokeDasharray={`${curveU * 2400} 2400`} opacity={0.9} />

          {/* the two probe models */}
          {probeU > 0 && (
            <g opacity={probeU}>
              <line x1={px(aA)} y1={py(sA)} x2={px(aA)} y2={PY0} stroke={colors.WARM} strokeDasharray="3 5" opacity={0.5} />
              <line x1={px(aB)} y1={py(sB)} x2={px(aB)} y2={PY0} stroke={colors.POSITIVE} strokeDasharray="3 5" opacity={0.5} />
              <circle cx={px(aA)} cy={py(sA)} r={9} fill={colors.WARM} />
              <circle cx={px(aB)} cy={py(sB)} r={9} fill={colors.POSITIVE} />
              <text x={px(aA)} y={py(sA) + 30} textAnchor="middle" fill={colors.WARM} fontSize={13.5}>
                model A
              </text>
              <text x={px(aB)} y={py(sB) - 18} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5}>
                model B (+0.5 ability)
              </text>
              {/* gap bracket */}
              <line x1={px(aB) + 34} y1={py(sA)} x2={px(aB) + 34} y2={py(sB)} stroke={colors.TEXT} strokeWidth={2} />
              <line x1={px(aB) + 28} y1={py(sA)} x2={px(aB) + 40} y2={py(sA)} stroke={colors.TEXT} strokeWidth={2} />
              <line x1={px(aB) + 28} y1={py(sB)} x2={px(aB) + 40} y2={py(sB)} stroke={colors.TEXT} strokeWidth={2} />
              <text x={px(aB) + 48} y={(py(sA) + py(sB)) / 2 + 5} fill={gapPts > 5 ? colors.POSITIVE : colors.NEGATIVE} fontSize={15} fontWeight={600}>
                {`gap ${gapPts.toFixed(1)} pts`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* leakage stage (screen-fixed) */}
      {leakStageU > 0 && (
        <g opacity={leakStageU * dimU * (1 - goodU)}>
          <rect x={140} y={120} width={460} height={260} rx={14} fill="none" stroke={colors.ACCENT} strokeDasharray="6 6" opacity={0.7} />
          <text x={160} y={148} fill={colors.ACCENT} fontSize={14.5}>
            public test set (year N)
          </text>
          <rect x={140} y={420} width={1000} height={170} rx={14} fill={colors.PANEL} opacity={0.5} stroke={colors.GRID} />
          <text x={160} y={448} fill={colors.MUTED} fontSize={14.5}>
            next crawl → training corpus (year N+1)
          </text>
          {LEAK_DOTS.map((d, i) => {
            const u = clamp01(leakDriftU * 1.5 - (i % 9) * 0.06);
            const y = d.y0 + d.dy * u;
            const inCorpus = y > 420;
            return <circle key={i} cx={d.x0} cy={y} r={6} fill={inCorpus ? colors.NEGATIVE : colors.WARM} opacity={0.85} />;
          })}
          {canaryU > 0 && (
            <g opacity={canaryU}>
              <rect x={680} y={150} width={430} height={200} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
              <text x={700} y={184} fill={colors.TEXT} fontSize={15} fontWeight={600}>
                longitudinal defenses
              </text>
              <text x={700} y={218} fill={colors.POSITIVE} fontSize={14}>
                canary strings — BIG-bench canary GUID
              </text>
              <text x={700} y={246} fill={colors.MUTED} fontSize={13}>
                in every eval file: filterable, probeable
              </text>
              <text x={700} y={282} fill={colors.POSITIVE} fontSize={14}>
                n-gram overlap audits of training corpora
              </text>
              <text x={700} y={310} fill={colors.MUTED} fontSize={13}>
                (GPT-4 / Llama reports ship these)
              </text>
            </g>
          )}
        </g>
      )}

      {/* Goodhart / leaderboard stage */}
      {goodU > 0 && (
        <g opacity={goodU * dimU}>
          <rect x={190} y={130} width={420} height={330} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={216} y={168} fill={colors.TEXT} fontSize={16} fontWeight={650}>
            THE LEADERBOARD
          </text>
          {['lab A — tuned scaffold', 'lab B — tuned data mix', 'lab C — tuned retries'].map((t, i) => (
            <g key={t}>
              <rect x={216} y={192 + i * 54} width={368} height={40} rx={9} fill={colors.BG} stroke={colors.GRID} />
              <text x={232} y={218 + i * 54} fill={colors.MUTED} fontSize={13.5}>
                {t}
              </text>
              <text x={568} y={218 + i * 54} textAnchor="end" fill={colors.WARM} fontSize={14} fontWeight={600}>
                {[92.1, 91.4, 90.8][i]}
              </text>
            </g>
          ))}
          <text x={216} y={400} fill={colors.NEGATIVE} fontSize={14}>
            optimization pressure → the metric, not the capability
          </text>
          <rect x={670} y={150} width={440} height={230} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.NEGATIVE} />
          <text x={696} y={188} fill={colors.TEXT} fontSize={15.5} fontWeight={650}>
            SWE-bench+ audit (2024)
          </text>
          <text x={696} y={230} fill={colors.NEGATIVE} fontSize={22} fontWeight={700}>
            32.7%
          </text>
          <text x={696} y={262} fill={colors.MUTED} fontSize={14}>
            of screened passing patches: solution was
          </text>
          <text x={696} y={286} fill={colors.MUTED} fontSize={14}>
            already in the issue text or comments
          </text>
          <text x={696} y={330} fill={colors.WARM} fontSize={13.5}>
            "solution leakage" — right answer, wrong skill
          </text>
        </g>
      )}

      {/* screen-fixed gap math */}
      <MathLabel
        tex={`\\Delta_{mid} = ${GAP_MID.toFixed(1)}\\;\\text{pts}\\quad \\Delta_{ceil} = ${GAP_CEIL.toFixed(1)}\\;\\text{pts}`}
        x={950}
        y={80}
        fontSize={18}
        color={colors.WARM}
        opacity={probeU * curveOpacity * dimU}
      />

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={204} width={820} height={230} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={274} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Three Deaths
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            saturation — the instrument goes deaf · leakage — it tests memory
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            Goodhart — the field aims at the metric itself
          </text>
          <text x={640} y={404} textAnchor="middle" fill={colors.ACCENT} fontSize={17}>
            next: SWE-bench hit all three — and was repaired in public
          </text>
        </g>
      )}
    </>
  );
}

export function EvalDeathModes() {
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
