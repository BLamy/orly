// Explained: AI Control — chapter 2: trusted monitoring.
// A real toy protocol simulated at module scope. The trusted model scores every
// submission for suspicion. Benign work scores ~ N(0,1); a backdoored submission
// scores ~ N(D,1) with D = 2.2 separation. The auditor spends its budget on the
// top-c% most suspicious submissions; a backdoor is caught iff its score clears
// the benign (1-c) quantile. Simulated catch-per-backdoor rises with budget:
//   0.5% → 35.5%   1% → 45.0%   2% → 55.8%   5% → 71.0%   10% → 82.1%
// (20,000 seeded submissions per budget). The point: monitoring converts a
// scarce human budget into a measurable catch rate — and the number is exactly
// as large as the budget and the monitor's separation allow.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
  gaussian,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The simulation.
// ---------------------------------------------------------------------------

const D = 2.2; // monitor separation
const N = 20000;
const rand = mulberry32(5);
const g = gaussian(rand);
interface Sub { bad: boolean; score: number }
const SUBS: Sub[] = [];
for (let i = 0; i < N; i++) {
  const bad = i % 2 === 0; // half benign, half backdoored (for measuring catch-per-backdoor)
  SUBS.push({ bad, score: (bad ? D : 0) + g() });
}
const BENIGN = SUBS.filter((s) => !s.bad).map((s) => s.score).sort((a, b) => a - b);
const BAD = SUBS.filter((s) => s.bad);
const quantile = (arr: number[], q: number) => arr[Math.min(arr.length - 1, Math.floor(q * arr.length))];

const BUDGETS = [0.005, 0.01, 0.02, 0.05, 0.10];
const CATCH = BUDGETS.map((c) => {
  const thr = quantile(BENIGN, 1 - c);
  const caught = BAD.filter((s) => s.score > thr).length;
  return { c, thr, rate: caught / BAD.length };
});
const AT2 = CATCH[2]; // 2% budget

// a small sample of submissions to display as a histogram-ish scatter
const sampleRand = mulberry32(77);
const sampleG = gaussian(sampleRand);
const SAMPLE: Sub[] = [];
for (let i = 0; i < 140; i++) {
  const bad = sampleRand() < 0.12; // rare backdoors in the shown sample
  SAMPLE.push({ bad, score: (bad ? D : 0) + sampleG() });
}

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const AX = 200;
const AY = 200;
const AW = 640;
const AH = 300;
const sx = (score: number) => AX + ((score + 3.5) / 8) * AW; // score range ~ [-3.5, 4.5]
const CAM_DIST: CameraState = { x: 560, y: 360, k: 1.12 };
const BX = 200;
const BY = 560;
const BW = 640;
const BH = 150;
const bx = (i: number) => BX + (i + 0.5) * (BW / BUDGETS.length);
const by = (v: number) => BY + BH - v * BH;

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  scoreU: ChannelRef<number>; // suspicion scores appear
  distU: ChannelRef<number>; // two distributions
  thrU: ChannelRef<number>; // audit threshold sweeps
  auditU: ChannelRef<number>; // audited region + catch
  curveU: ChannelRef<number>; // catch vs budget curve
  numU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const scoreU = tl.channel('scoreU', 0);
  const distU = tl.channel('distU', 0);
  const thrU = tl.channel('thrU', 0);
  const auditU = tl.channel('auditU', 0);
  const curveU = tl.channel('curveU', 0);
  const numU = tl.channel('numU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the idea
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The simplest protocol costs almost nothing. Have the weak trusted model read every single thing the strong model submits, and rate it for suspicion. It cannot write the code — but it can often smell when something is off. Every submission gets a score.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_DIST, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.tween(scoreU, 1, { at: 1.8, dur: 2.6, ease: ease.linear });
  tl.hold(6.1, 0.5);

  // Beat 2 — two distributions
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Across many submissions, two populations appear. Honest work clusters at low suspicion. Backdoored work leans higher — the monitor is imperfect, so the two piles overlap badly. If they separated cleanly this would be easy; the whole problem is that they do not.',
  });
  tl.tween(distU, 1, { at: 7.6, dur: 2.0, ease: ease.draw });
  tl.hold(12.4, 0.6);

  // Beat 3 — the audit threshold
  tl.caption({
    at: 13.0,
    dur: 5.8,
    text: 'Here is where the scarce human budget enters. You cannot audit everything — say you can afford two percent. So audit the two percent that scored most suspicious. That sets a threshold, and everything to its right gets a human’s full attention.',
  });
  tl.tween(thrU, 1, { at: 14.0, dur: 1.6, ease: ease.move });
  tl.tween(auditU, 1, { at: 15.4, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 19.4,
    dur: 5.4,
    text: 'Run it. With a monitor this noisy and a two percent budget, the simulation catches about fifty six percent of backdoors — the ones suspicious enough to clear the bar. Better than a coin flip, from a model too weak to do the task, spending almost no human time.',
  });
  tl.tween(numU, 1, { at: 20.6, dur: 0.8, ease: ease.enter });
  tl.hold(24.8, 0.6);

  // Beat 4 — budget curve
  tl.caption({
    at: 25.4,
    dur: 5.8,
    text: 'And catch rate is a dial you can turn. Spend half a percent of the budget and you catch about a third; spend ten percent and you catch four in five. More auditing buys more safety, smoothly — the curve is the price list. But every point you buy on safety, you pay for in trusted human time.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 25.7, dur: 1.3, ease: ease.move });
  tl.tween(curveU, 1, { at: 26.6, dur: 2.4, ease: ease.draw });
  tl.hold(31.8, 0.6);

  // Beat 5 — the catch
  tl.caption({
    at: 32.4,
    dur: 5.4,
    text: 'But notice the assumption hiding in the histogram: it pretended backdoors arrive at a fixed rate. They do not. The untrusted model chooses when to defect — and if it is smart, it will defect exactly as rarely as it can get away with. That choice is the next chapter.',
  });
  tl.tween(dimU, 1, { at: 33.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 34.4, dur: 1.0, ease: ease.enter });
  tl.hold(38.0, 1.4);

  return { tl, cam, titleU, scoreU, distU, thrU, auditU, curveU, numU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/trusted-monitoring/overrides.json', slug: 'trusted-monitoring' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const scoreU = s.get(scene.scoreU);
  const distU = s.get(scene.distU);
  const thrU = s.get(scene.thrU);
  const auditU = s.get(scene.auditU);
  const curveU = s.get(scene.curveU);
  const numU = s.get(scene.numU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const distFade = 1 - 0.85 * clamp01(curveU * 2.5);
  const thr = sx(AT2.thr);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the score axis + sample points */}
          {scoreU > 0 && distFade > 0.05 && (
            <g opacity={distFade}>
              <line x1={AX} y1={AY + AH} x2={AX + AW} y2={AY + AH} stroke={colors.GRID} strokeWidth={1.5} opacity={scoreU} />
              <text x={AX + AW / 2} y={AY + AH + 34} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} opacity={scoreU}>
                trusted monitor’s suspicion score →
              </text>
              {/* audited region shading */}
              {auditU > 0 && (
                <rect x={thr} y={AY} width={AX + AW - thr} height={AH} fill={colors.WARM} opacity={0.1 * auditU} />
              )}
              {SAMPLE.map((p, i) => {
                const u = clamp01(scoreU * SAMPLE.length - i);
                if (u <= 0) return null;
                const x = sx(p.score);
                // deterministic vertical jitter from index
                const y = AY + AH - 14 - ((i * 37) % (AH - 40));
                const audited = auditU > 0 && x > thr;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={p.bad ? 5 : 3.5}
                    fill={p.bad ? colors.NEGATIVE : colors.POSITIVE}
                    opacity={(p.bad ? 0.95 : 0.5) * u * (audited ? 1 : 0.8)}
                    stroke={audited && p.bad ? colors.WARM : 'none'}
                    strokeWidth={audited && p.bad ? 2 : 0}
                  />
                );
              })}
              {/* distribution curves */}
              {distU > 0 && (
                <g opacity={distU}>
                  {[{ mu: 0, col: colors.POSITIVE }, { mu: D, col: colors.NEGATIVE }].map((d) => {
                    const pts: string[] = [];
                    for (let k = 0; k <= 60; k++) {
                      const x = -3.5 + (k / 60) * 8;
                      const y = Math.exp(-0.5 * (x - d.mu) * (x - d.mu));
                      pts.push(`${sx(x)} ${AY + AH - y * (AH - 30)}`);
                    }
                    return <polyline key={d.mu} points={pts.join(' ')} fill="none" stroke={d.col} strokeWidth={2.5} opacity={0.9} />;
                  })}
                </g>
              )}
              {/* threshold line */}
              {thrU > 0 && (
                <g opacity={thrU}>
                  <line x1={thr} y1={AY - 10} x2={thr} y2={AY + AH} stroke={colors.WARM} strokeWidth={2.5} strokeDasharray="7 5" />
                  <text x={thr + 8} y={AY + 6} fill={colors.WARM} fontSize={12} fontFamily="monospace" fontWeight={700}>
                    audit top 2% →
                  </text>
                </g>
              )}
              {numU > 0 && (
                <text x={AX} y={AY - 12} fill={colors.TEXT} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={numU}>
                  catch-per-backdoor at 2% budget: {(AT2.rate * 100).toFixed(1)}%
                </text>
              )}
            </g>
          )}

          {/* budget curve */}
          {curveU > 0 && (
            <g opacity={curveU}>
              <line x1={BX} y1={BY} x2={BX} y2={BY + BH} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={BX} y1={BY + BH} x2={BX + BW} y2={BY + BH} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={BX + BW / 2} y={BY + BH + 30} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                audit budget (share of submissions) — 20,000 seeded per point
              </text>
              <text x={BX - 14} y={BY + 6} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">100%</text>
              <text x={BX - 14} y={BY + BH} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">0</text>
              <polyline
                points={CATCH.map((p, i) => `${bx(i)} ${by(p.rate)}`).join(' ')}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={3}
                opacity={clamp01(curveU * 1.5)}
              />
              {CATCH.map((p, i) => {
                const u = clamp01(curveU * CATCH.length - i);
                if (u <= 0) return null;
                return (
                  <g key={p.c} opacity={u}>
                    <circle cx={bx(i)} cy={by(p.rate)} r={5} fill={colors.POSITIVE} />
                    <text x={bx(i)} y={by(p.rate) - 12} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
                      {(p.rate * 100).toFixed(0)}%
                    </text>
                    <text x={bx(i)} y={BY + BH + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
                      {(p.c * 100).toFixed(p.c < 0.01 ? 1 : 0)}%
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          A weak model, watching
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Auditing turns budget into catch rate.
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            2% budget → {(AT2.rate * 100).toFixed(0)}% caught · 0.5% → {(CATCH[0].rate * 100).toFixed(0)}% · 10% → {(CATCH[4].rate * 100).toFixed(0)}% (computed)
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            real safety, from a monitor too weak to do the job
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            but the attacker chooses when to defect — next
          </text>
        </g>
      )}
    </>
  );
}

export function TrustedMonitoring() {
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
