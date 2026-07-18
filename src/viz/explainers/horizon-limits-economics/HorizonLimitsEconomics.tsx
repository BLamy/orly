// arXiv:2606.30616 — "Scaling the Horizon, Not the Parameters" (Agents-A1).
// Chapter 4: where the trick holds, where it doesn't, and the arithmetic.
// Honest ledger from the paper: trails on SciCode 44.3 (vs 56.1 GPT-5.5),
// HLE 47.6 (vs 54.0 Kimi-K2.6), BrowseComp 75.5 (vs 84.4). The authors name
// the gap themselves: ML engineering stresses "keeping a stable goal,
// remembering past decisions, and avoiding repeated trials" — atomic
// abilities (planning before reasoning, reflection before acting, long-
// context summarizing) they list as future work.
// ECONOMICS: the paper reports NO cost analysis — we say so on screen. The
// arithmetic below is OURS from public sizes: per-token compute scales with
// active parameters, so 35B vs ~1T is ~28.6x cheaper per token; a 45K-token
// trajectory on the 35B costs about as much as a 1.6K-token answer from a
// trillion-parameter model (45,000 / 28.6 ≈ 1,574).
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// where it trails (reported)
const TRAILS = [
  { name: 'SciCode', a1: 44.3, big: 56.1, bigOf: 'GPT-5.5' },
  { name: 'HLE (tools)', a1: 47.6, big: 54.0, bigOf: 'Kimi-K2.6' },
  { name: 'BrowseComp', a1: 75.5, big: 84.4, bigOf: 'GPT-5.5' },
];

// the authors' own named weaknesses
const WEAK = [
  'keeping a stable goal over a long run',
  'remembering past decisions',
  'avoiding repeated trials',
];

// our arithmetic
const PARAM_RATIO = 1000 / 35; // ≈ 28.6
const TRAJ_TOKENS = 45000;
const EQUIV_TOKENS = Math.round(TRAJ_TOKENS / PARAM_RATIO); // ≈ 1575

const CAM_TRAILS: CameraState = { x: 400, y: 280, k: 1.3 };
const CAM_MATH: CameraState = { x: 700, y: 430, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  trailsU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  weakU: ChannelRef<number>;
  ecoU: ChannelRef<number>;
  mathU: ChannelRef<number>;
  punchU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const trailsU = tl.channel('trailsU', 0);
  const fillU = tl.channel('fillU', 0);
  const weakU = tl.channel('weakU', 0);
  const ecoU = tl.channel('ecoU', 0);
  const mathU = tl.channel('mathU', 0);
  const punchU = tl.channel('punchU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the honest column
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Every scaling story earns trust by naming where it loses. Here is that column, straight from the paper. Raw code synthesis. Broad tool assisted exams. Open web browsing. The giants keep all three.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_TRAILS, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(trailsU, 1, { at: 1.6, dur: 2.4, ease: ease.linear });
  tl.tween(fillU, 1, { at: 4.0, dur: 1.4, ease: ease.move });
  tl.hold(5.9, 0.7);

  // Beat 2 — why, in the authors' words
  tl.caption({
    at: 6.6,
    dur: 6.0,
    text: 'And the authors diagnose their own gap. Long machine learning engineering runs stress exactly what a small model lacks: keeping a stable goal, remembering past decisions, and not repeating failed trials.',
  });
  tl.tween(weakU, 1, { at: 7.6, dur: 2.4, ease: ease.linear });
  tl.caption({
    at: 12.9,
    dur: 4.6,
    text: 'In other words: the harness gives you retries and receipts, but coherence across the whole tree still leans on capacity. Horizon is not a free substitute everywhere.',
  });
  tl.hold(17.5, 0.7);

  // Beat 3 — economics setup
  tl.caption({
    at: 18.2,
    dur: 5.6,
    text: 'Now the economics — with a caveat first. The paper reports no cost analysis, so the arithmetic you are about to see is ours, from public model sizes, and it is deliberately rough.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 18.4, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_MATH, { at: 19.9, dur: 1.2, ease: ease.move });
  tl.tween(ecoU, 1, { at: 19.4, dur: 0.9, ease: ease.enter });
  tl.hold(23.8, 0.6);

  // Beat 4 — the arithmetic
  tl.caption({
    at: 24.4,
    dur: 6.2,
    text: 'Per token, compute scales with active parameters. Thirty five billion against a trillion is roughly a twenty nine fold discount per token. So a forty five thousand token trajectory on the small model costs about what sixteen hundred tokens cost on the giant.',
  });
  tl.tween(mathU, 1, { at: 25.4, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 31.1,
    dur: 5.6,
    text: 'Read that again. The small agent can afford to explore, execute, fail, and verify for an entire working session — for the price of the big model clearing its throat. That is why the horizon axis was worth buying.',
  });
  tl.tween(punchU, 1, { at: 32.4, dur: 0.9, ease: ease.pop });
  tl.hold(36.7, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 37.4,
    dur: 5.6,
    text: 'So the ledger balances like this: five benchmark wins, three losses, a named coherence gap — and a cost profile that makes long verified search cheap enough to be the default, not the luxury.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.6, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 38.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.0, dur: 1.0, ease: ease.enter });
  tl.hold(43.0, 1.2);

  return {
    tl, cam, titleU, trailsU, fillU, weakU, ecoU, mathU,
    punchU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/horizon-limits-economics/overrides.json',
  slug: 'horizon-limits-economics',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const trailsU = s.get(scene.trailsU);
  const fillU = s.get(scene.fillU);
  const weakU = s.get(scene.weakU);
  const ecoU = s.get(scene.ecoU);
  const mathU = s.get(scene.mathU);
  const punchU = s.get(scene.punchU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* trails bars */}
          {trailsU > 0 && (
            <g>
              <text x={130} y={140} fill={colors.TEXT} fontSize={16} opacity={trailsU}>
                where the giants keep the lead
              </text>
              <text x={130} y={160} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={trailsU}>
                reported — replotted, not re-run
              </text>
              {TRAILS.map((b, i) => {
                const u = clamp01(trailsU * TRAILS.length - i);
                if (u <= 0) return null;
                const y = 190 + i * 74;
                const wa = (b.a1 / 90) * 380 * fillU;
                const wb = (b.big / 90) * 380 * fillU;
                return (
                  <g key={b.name} opacity={u}>
                    <text x={230} y={y + 12} textAnchor="end" fill={colors.TEXT} fontSize={14}>
                      {b.name}
                    </text>
                    <rect x={245} y={y} width={Math.max(wa, 2)} height={16} rx={3} fill={colors.ACCENT} opacity={0.6} />
                    <rect x={245} y={y + 22} width={Math.max(wb, 2)} height={16} rx={3} fill={colors.NEGATIVE} opacity={0.65} />
                    <text x={253 + wa} y={y + 13} fill={colors.ACCENT} fontSize={12} fontFamily={MONO} opacity={fillU}>
                      {b.a1} · Agents-A1
                    </text>
                    <text x={253 + wb} y={y + 35} fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} opacity={fillU}>
                      {b.big} · {b.bigOf}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the authors' own diagnosis */}
          {weakU > 0 && (
            <g>
              <text x={760} y={140} fill={colors.TEXT} fontSize={16} opacity={weakU}>
                the authors name the gap
              </text>
              {WEAK.map((w, i) => {
                const u = clamp01(weakU * WEAK.length - i);
                if (u <= 0) return null;
                const y = 170 + i * 52;
                return (
                  <g key={w} opacity={u}>
                    <rect x={760} y={y} width={400} height={40} rx={9} fill={colors.WARM} opacity={0.1} />
                    <rect x={760} y={y} width={4} height={40} rx={2} fill={colors.WARM} />
                    <text x={778} y={y + 25} fill={colors.TEXT} fontSize={14}>
                      {w}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* economics panel */}
          {ecoU > 0 && (
            <g opacity={ecoU}>
              <rect x={300} y={370} width={800} height={190} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.GRID} />
              <text x={324} y={402} fill={colors.TEXT} fontSize={16} fontWeight={600}>
                cost per task — our arithmetic, not the paper's
              </text>
              <text x={324} y={422} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                the paper reports no cost analysis; this uses public parameter counts only
              </text>
              {mathU > 0 && (
                <g opacity={mathU}>
                  <MathLabel
                    tex={'\\frac{1000\\mathrm{B}}{35\\mathrm{B}} \\approx 28.6\\times \\text{ per token}'}
                    x={520}
                    y={480}
                    fontSize={19}
                    color={colors.TEXT}
                  />
                  <MathLabel
                    tex={'\\frac{45{,}000 \\text{ tok}}{28.6} \\approx 1{,}600 \\text{ tok}'}
                    x={900}
                    y={480}
                    fontSize={19}
                    color={colors.ACCENT}
                  />
                </g>
              )}
              {punchU > 0 && (
                <text x={700} y={535} textAnchor="middle" fill={colors.WARM} fontSize={15} fontWeight={600} opacity={punchU}>
                  a full 45K-token working session ≈ the giant's 1,600-token reply
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Where it holds, and what it costs
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.30616 · limits
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Horizon is cheap; coherence is not
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            five wins, three losses, a named coherence gap — and a ~29x
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            per-token discount that makes long verified search the default
          </text>
        </g>
      )}
    </>
  );
}

export function HorizonLimitsEconomics() {
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
