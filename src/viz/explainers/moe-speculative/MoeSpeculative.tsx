// Fresh from arXiv №3, chapter 3 — speculative decoding meets the mixture.
// Paper: arXiv:2607.12696 "Less Experts, Faster Decoding: Cost-Aware
// Speculative Decoding for Mixture-of-Experts" (EcoSpec). The paper's insight:
// confidence-driven drafting causes EXPERT SCATTERING — high-probability
// draft tokens route to disjoint experts, inflating expert-weight memory
// traffic — so drafts should trade a little acceptance for expert reuse.
// The loop below is genuinely simulated at module scope (mulberry32, 4000
// rounds, 4-token drafts, top-2 of 32 experts, round cost = fixed + per-
// distinct-expert): confidence-only drafting accepts more tokens but touches
// ~7.2 experts/round for a 1.42x speedup; cost-aware drafting accepts
// slightly fewer, touches ~4.8, and reaches 1.67x. The paper reports up to
// 1.62x on real models (DeepSeek V3.1, Qwen3-235B, GPT-OSS-120B) — our toy
// shows the direction, their kernels show the number.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The simulation (module scope, seeded).
// ---------------------------------------------------------------------------

const K = 4;
const N_EXP = 32;
const TOPK = 2;
const ROUNDS = 4000;
const C_FIX = 1.0;
const C_EXP = 0.6;

interface SimOut {
  tokensPerCost: number;
  meanExperts: number;
  speedup: number;
}

function simulate(pAcc: number, reuse: number, seed: number): SimOut {
  const rnd = mulberry32(seed);
  let toks = 0;
  let time = 0;
  let expSum = 0;
  for (let r = 0; r < ROUNDS; r++) {
    const ex = new Set<number>();
    const anchor = Math.floor(rnd() * N_EXP);
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < TOPK; j++) {
        const e = rnd() < reuse ? (anchor + j) % N_EXP : Math.floor(rnd() * N_EXP);
        ex.add(e);
      }
    }
    let acc = 0;
    while (acc < K && rnd() < pAcc) acc++;
    toks += acc + 1;
    time += C_FIX + C_EXP * ex.size;
    expSum += ex.size;
  }
  const base = 1 / (C_FIX + C_EXP * TOPK);
  return { tokensPerCost: toks / time, meanExperts: expSum / ROUNDS, speedup: toks / time / base };
}

const CONF = simulate(0.8, 0, 7); // scattering: ~7.2 experts, 1.42x
const ECO = simulate(0.74, 0.6, 7); // reuse: ~4.8 experts, 1.67x

// one illustrative round for the animation (seeded, precomputed)
const demoRnd = mulberry32(42);
const demoExperts = (reuse: number): number[] => {
  const anchor = 5;
  const out: number[] = [];
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < TOPK; j++) {
      out.push(demoRnd() < reuse ? (anchor + j) % N_EXP : Math.floor(demoRnd() * N_EXP));
    }
  }
  return out;
};
const DEMO_SCATTER = demoExperts(0); // 8 activations, mostly distinct
const DEMO_REUSE = demoExperts(0.6);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const LOOP_Y = 190;
const DRAFT_X = 170;
const VERIFY_X = 620;
const GRID_X = 170;
const GRID_Y = 330;
const GCOL = 8;
const GCELL = 34;

const CAM_LOOP: CameraState = { x: 520, y: 250, k: 1.25 };
const CAM_GRID: CameraState = { x: 560, y: 380, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  draftP: ChannelRef<number>;
  acceptU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  scatterU: ChannelRef<number>;
  reuseU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const loopU = tl.channel('loopU', 0);
  const draftP = tl.channel('draftP', 0);
  const acceptU = tl.channel('acceptU', 0);
  const gridU = tl.channel('gridU', 0);
  const scatterU = tl.channel('scatterU', 0);
  const reuseU = tl.channel('reuseU', 0);
  const barsU = tl.channel('barsU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the draft/verify loop
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Speculative decoding is a bet: let a small, cheap drafter guess four tokens ahead, then have the big model check them all in one pass. Accepted guesses are nearly free tokens.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_LOOP, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(loopU, 1, { at: 1.2, dur: 1.4, ease: ease.enter });
  tl.tween(draftP, 1, { at: 3.0, dur: 2.2, ease: ease.linear });
  tl.tween(acceptU, 1, { at: 5.4, dur: 0.8, ease: ease.pop });
  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'On a dense model the accounting is simple: the more guesses survive verification, the faster you go. So drafters are tuned for one thing — acceptance.',
  });
  tl.hold(11.9, 0.6);

  // Beat 2 — expert scattering
  tl.caption({
    at: 12.5,
    dur: 6.2,
    text: 'A mixture of experts breaks that accounting. Every drafted token drags its own two experts into memory. Watch a confident drafter at work: four tokens, and the activations scatter across the expert grid.',
  });
  tl.tween(cam, CAM_GRID, { at: 12.8, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 13.4, dur: 1.2, ease: ease.draw });
  tl.tween(scatterU, 1, { at: 15.2, dur: 2.4, ease: ease.linear });
  tl.caption({
    at: 19.1,
    dur: 5.6,
    text: 'The paper names this expert scattering: high probability tokens that route to disjoint experts. Each verify pass now hauls seven expert weight sets across the bus instead of two.',
  });
  tl.hold(24.7, 0.6);

  // Beat 3 — the cost-aware trade
  tl.caption({
    at: 25.3,
    dur: 6.0,
    text: 'The fix is a trade. Prefer draft paths that reuse experts already in the buffer, even when a slightly likelier token exists. Acceptance dips a little; memory traffic drops a lot.',
  });
  tl.tween(reuseU, 1, { at: 26.4, dur: 2.4, ease: ease.linear });
  tl.hold(31.5, 0.6);

  // Beat 4 — the simulated race
  tl.caption({
    at: 32.1,
    dur: 6.2,
    text: 'We simulated four thousand rounds of each strategy with a per expert loading cost. Chasing acceptance alone: one point four times faster than plain decoding. Trading a bit of acceptance for reuse: one point seven.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.4, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 1, { at: 33.4, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 38.5,
    dur: 5.4,
    text: 'On the real frontier models, the paper reports up to one point six two times — with the draft acceptance mechanism untouched. The win comes purely from being cheaper about which experts wake up.',
  });
  tl.hold(43.9, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 44.5,
    dur: 5.2,
    text: 'The lesson generalizes: on a mixture, a token is not just likely or unlikely — it is cheap or expensive. The next chapter asks where those expensive experts should even live.',
  });
  tl.tween(closeU, 1, { at: 45.3, dur: 1.0, ease: ease.enter });
  tl.hold(49.7, 1.2);

  return { tl, cam, titleU, loopU, draftP, acceptU, gridU, scatterU, reuseU, barsU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/moe-speculative/overrides.json',
  slug: 'moe-speculative',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function ExpertGrid({
  x,
  y,
  hits,
  prog,
  label,
  color,
  u,
}: {
  x: number;
  y: number;
  hits: number[];
  prog: number;
  label: string;
  color: string;
  u: number;
}) {
  if (u <= 0) return null;
  const shown = new Set(hits.slice(0, Math.round(prog * hits.length)));
  return (
    <g opacity={u}>
      <text x={x} y={y - 14} fill={color} fontSize={14}>
        {label}
      </text>
      {Array.from({ length: N_EXP }, (_, e) => (
        <rect
          key={e}
          x={x + (e % GCOL) * GCELL}
          y={y + Math.floor(e / GCOL) * GCELL}
          width={GCELL - 4}
          height={GCELL - 4}
          rx={5}
          fill={shown.has(e) ? color : colors.PANEL}
          stroke={colors.GRID}
          opacity={shown.has(e) ? 0.9 : 0.6}
        />
      ))}
      {prog > 0.95 && (
        <text x={x} y={y + 4 * GCELL + 18} fill={color} fontSize={13} fontFamily="monospace">
          {new Set(hits).size} distinct experts loaded
        </text>
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const loopU = s.get(scene.loopU);
  const draftP = s.get(scene.draftP);
  const acceptU = s.get(scene.acceptU);
  const gridU = s.get(scene.gridU);
  const scatterU = s.get(scene.scatterU);
  const reuseU = s.get(scene.reuseU);
  const barsU = s.get(scene.barsU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;
  const accepts = [true, true, true, false]; // illustrative round: 3 of 4 accepted

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the loop */}
          {loopU > 0 && (
            <g opacity={loopU}>
              <rect x={DRAFT_X} y={LOOP_Y} width={170} height={52} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={DRAFT_X + 85} y={LOOP_Y + 31} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                small drafter
              </text>
              <rect x={VERIFY_X} y={LOOP_Y} width={210} height={52} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={VERIFY_X + 105} y={LOOP_Y + 31} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                big model verifies
              </text>
              {/* drafted tokens travel */}
              {Array.from({ length: K }, (_, i) => {
                const u = clamp01(draftP * (K + 1) - i);
                if (u <= 0) return null;
                const x = DRAFT_X + 180 + (VERIFY_X - DRAFT_X - 200) * Math.min(1, u);
                return (
                  <g key={i} opacity={Math.min(1, u * 2)}>
                    <circle cx={x} cy={LOOP_Y + 26 + (i - 1.5) * 12} r={7} fill={colors.ACCENT} />
                    {acceptU > 0 && u >= 1 && (
                      <text
                        x={VERIFY_X + 220}
                        y={LOOP_Y + 31 + (i - 1.5) * 16}
                        fill={accepts[i] ? colors.POSITIVE : colors.NEGATIVE}
                        fontSize={15}
                        fontWeight={700}
                        opacity={acceptU}
                      >
                        {accepts[i] ? '✓' : '✕'}
                      </text>
                    )}
                  </g>
                );
              })}
              {acceptU > 0 && (
                <text x={DRAFT_X} y={LOOP_Y + 84} fill={colors.MUTED} fontSize={13} opacity={acceptU}>
                  three accepted plus one corrected token — four for the price of one pass
                </text>
              )}
            </g>
          )}

          {/* the two expert grids */}
          <ExpertGrid x={GRID_X} y={GRID_Y} hits={DEMO_SCATTER} prog={scatterU} label="confidence-only draft: scattering" color={colors.WARM} u={gridU} />
          <ExpertGrid x={GRID_X + 420} y={GRID_Y} hits={DEMO_REUSE} prog={reuseU} label="cost-aware draft: reuse" color={colors.POSITIVE} u={gridU} />

          {/* simulated speedups */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={880} y={GRID_Y - 14} fill={colors.TEXT} fontSize={15}>
                simulated speedup vs plain decoding
              </text>
              {[
                { label: 'confidence-only', v: CONF.speedup, exp: CONF.meanExperts, c: colors.WARM },
                { label: 'cost-aware', v: ECO.speedup, exp: ECO.meanExperts, c: colors.POSITIVE },
              ].map((r, i) => (
                <g key={r.label}>
                  <text x={880} y={GRID_Y + 22 + i * 64} fill={colors.MUTED} fontSize={13}>
                    {r.label} · {r.exp.toFixed(1)} experts/round
                  </text>
                  <rect x={880} y={GRID_Y + 30 + i * 64} width={150 * r.v * barsU} height={18} rx={4} fill={r.c} opacity={0.85} />
                  <text x={886 + 150 * r.v * barsU} y={GRID_Y + 44 + i * 64} fill={r.c} fontSize={14} fontFamily="monospace">
                    {r.v.toFixed(2)}×
                  </text>
                </g>
              ))}
              <text x={880} y={GRID_Y + 22 + 2 * 64 + 8} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                paper, real models: up to 1.62× (reported)
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Less experts, faster decoding
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.12696 · loop simulated, 4000 rounds
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            A guess has a memory price.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Trading a sliver of acceptance for expert reuse beat the
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            pure-acceptance drafter — in our toy and in their paper.
          </text>
        </g>
      )}
    </>
  );
}

export function MoeSpeculative() {
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
