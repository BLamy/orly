// Explained: Inference — chapter 4: speculative decoding, the dense-model
// mechanics. (The MoE-specific cost of speculation — expert scattering — is
// arxiv-serving-moe's chapter; this one is the base machine.) A real
// simulation at module scope: drafter agreement p = 0.7, draft depth k = 4,
// 2000 seeded verify rounds. Closed form E[tokens/pass] = Σ_{i=0..k} p^i =
// 2.773; simulated mean 2.737; acceptance-run histogram [618,443,267,191,481];
// with the drafter costing 10% of the big model per token, end-to-end
// speedup ≈ 1.96×. Every quoted number computed below.
import { scaleLinear } from 'd3';
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
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The speculation math, module scope.
// ---------------------------------------------------------------------------

const P = 0.7; // per-token drafter agreement
const K = 4; // draft depth

// closed form: expected tokens banked per verify pass (accepted run + the
// big model's own token, which is free in the same pass)
let EXPECTED = 0;
for (let i = 0; i <= K; i++) EXPECTED += P ** i; // 2.773

// simulate 2000 rounds
const ROUNDS = 2000;
const rand = mulberry32(11);
const HIST = Array.from({ length: K + 1 }, () => 0);
let totalTokens = 0;
const runLengths: number[] = [];
for (let r = 0; r < ROUNDS; r++) {
  let a = 0;
  while (a < K && rand() < P) a++;
  HIST[a]++;
  totalTokens += a + 1;
  runLengths.push(a);
}
const SIM_MEAN = totalTokens / ROUNDS; // 2.737
const DRAFT_COST = 0.1; // drafter step ≈ 10% of a big-model step
const SPEEDUP = SIM_MEAN / (1 + K * DRAFT_COST); // ≈ 1.96

// the first 3 rounds of the actual simulation drive the on-stage token strip
const DEMO_RUNS = runLengths.slice(0, 3); // seeded → deterministic

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const TOK_W = 74;
const TOK_H = 40;
const STRIP_X = 220;
const STRIP_Y = 240;

const HIST_X = scaleLinear().domain([-0.5, K + 0.5]).range([760, 1140]);
const HIST_Y = scaleLinear().domain([0, 700]).range([560, 330]);

const CAM_STRIP: CameraState = { x: 560, y: 300, k: 1.25 };
const CAM_HIST: CameraState = { x: 900, y: 440, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  stripU: ChannelRef<number>; // drafter writes the 4 guesses
  verifyU: ChannelRef<number>; // verification wave over the guesses
  round: ChannelRef<number>; // which demo round is on stage (0..2)
  bankU: ChannelRef<number>; // banked-token counter
  histU: ChannelRef<number>; // histogram bars grow
  mathU: ChannelRef<number>;
  costU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const stripU = tl.channel('stripU', 0);
  const verifyU = tl.channel('verifyU', 0);
  const round = tl.channel('round', 0);
  const bankU = tl.channel('bankU', 0);
  const histU = tl.channel('histU', 0);
  const mathU = tl.channel('mathU', 0);
  const costU = tl.channel('costU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the asymmetry
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Here is a strange asymmetry from chapter one: checking tokens is cheap, because prefill runs in parallel. Only producing them one by one is slow. Speculative decoding is built entirely on that gap.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'The scheme: a small, cheap drafter model guesses the next four tokens. Then the big model checks all four in a single parallel pass — the same kind of pass that read your prompt.',
  });
  tl.tween(cam, CAM_STRIP, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: 8.0, dur: 2.0, ease: ease.linear });
  tl.hold(12.3, 0.5);

  // Beat 2 — verification, three real rounds
  tl.caption({
    at: 12.8,
    dur: 5.8,
    text: 'Verification keeps the longest prefix the big model agrees with, throws the rest away, and adds one token of its own. Watch three real rounds from a simulation where the drafter agrees seventy percent of the time.',
  });
  tl.tween(verifyU, 1, { at: 14.0, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 18.8,
    dur: 5.2,
    text: 'A full acceptance banks five tokens for one big-model pass. An immediate miss still banks one — you never do worse than plain decoding, you only sometimes do much better.',
  });
  tl.tween(round, 1, { at: 19.4, dur: 0.01, ease: ease.linear });
  tl.tween(stripU, 2, { at: 19.6, dur: 1.4, ease: ease.linear });
  tl.tween(verifyU, 2, { at: 21.2, dur: 1.6, ease: ease.linear });
  tl.caption({
    at: 24.2,
    dur: 4.6,
    text: 'And because the big model checks every kept token, the output is exactly what it would have said on its own. Speculation changes the speed, not the words.',
  });
  tl.tween(round, 2, { at: 24.6, dur: 0.01, ease: ease.linear });
  tl.tween(stripU, 3, { at: 24.8, dur: 1.4, ease: ease.linear });
  tl.tween(verifyU, 3, { at: 26.4, dur: 1.6, ease: ease.linear });
  tl.tween(bankU, 1, { at: 27.4, dur: 0.7, ease: ease.pop });
  tl.hold(28.8, 0.6);

  // Beat 3 — two thousand rounds
  tl.caption({
    at: 29.4,
    dur: 5.8,
    text: 'Run two thousand rounds and count how many guesses survive each pass. Misses on the first guess are common — but so are clean sweeps, and a sweep pays four to one.',
  });
  tl.tween(cam, CAM_HIST, { at: 29.7, dur: 1.4, ease: ease.move });
  tl.tween(histU, 1, { at: 30.8, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 35.4,
    dur: 6.0,
    text: 'The closed form says two point seven seven tokens per pass at seventy percent agreement; the simulation measures two point seven four. Theory and the seeded run agree to a percent.',
  });
  tl.tween(mathU, 1, { at: 36.4, dur: 0.9, ease: ease.enter });
  tl.hold(41.4, 0.6);

  // Beat 4 — the honest bill
  tl.caption({
    at: 42.0,
    dur: 6.0,
    text: 'The drafter is not free — say each guess costs a tenth of a big-model step. Four guesses plus one verify per round, against two point seven four tokens banked: just under two times faster, end to end.',
  });
  tl.tween(costU, 1, { at: 43.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.4,
    dur: 5.0,
    text: 'Everything hinges on agreement. A drafter that predicts well doubles your speed; one that rambles pays for guesses the verifier shreds. On mixture models the accounting twists further — that story is in the serving the mixture book.',
  });
  tl.hold(53.4, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 54.0,
    dur: 5.4,
    text: 'Batching filled the chip sideways; speculation stretches each step forward. One lever remains: shrink the weights themselves. That is the final chapter.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 54.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 54.9, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.9, dur: 0.9, ease: ease.enter });
  tl.hold(59.6, 1.2);

  return { tl, cam, titleU, stripU, verifyU, round, bankU, histU, mathU, costU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/inference-speculative/overrides.json',
  slug: 'inference-speculative',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const stripU = s.get(scene.stripU);
  const verifyU = s.get(scene.verifyU);
  const roundIdx = Math.round(s.get(scene.round));
  const bankU = s.get(scene.bankU);
  const histU = s.get(scene.histU);
  const mathU = s.get(scene.mathU);
  const costU = s.get(scene.costU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  // per-round progress: stripU and verifyU advance by 1 per demo round
  const draftProg = clamp01(stripU - roundIdx); // guesses appearing
  const verifyProg = clamp01(verifyU - roundIdx); // wave over the 4 + correction
  const accepted = DEMO_RUNS[Math.min(roundIdx, DEMO_RUNS.length - 1)];
  // banked so far across completed demo rounds
  const banked = DEMO_RUNS.slice(0, Math.min(roundIdx + (verifyProg >= 1 ? 1 : 0), 3)).reduce(
    (a, b) => a + b + 1,
    0,
  );

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the draft strip */}
          {stripU > 0 && (
            <g>
              <text x={STRIP_X} y={STRIP_Y - 66} fill={colors.TEXT} fontSize={16}>
                round {Math.min(3, roundIdx + 1)} of the simulation — drafter guesses, big model verifies
              </text>
              <text x={STRIP_X} y={STRIP_Y - 42} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                p(agree) = {P} · draft depth k = {K}
              </text>
              {Array.from({ length: K }, (_, i) => {
                const appear = clamp01(draftProg * K - i);
                if (appear <= 0) return null;
                const vw = clamp01(verifyProg * (K + 1) - i); // verify wave hits token i
                const isAccepted = i < accepted;
                const judged = vw >= 1;
                const fill = !judged
                  ? colors.PANEL
                  : isAccepted
                    ? colors.POSITIVE
                    : colors.NEGATIVE;
                const op = judged && !isAccepted && verifyProg >= 1 ? 0.35 : 0.9;
                return (
                  <g key={i} opacity={appear}>
                    <rect
                      x={STRIP_X + i * (TOK_W + 12)}
                      y={STRIP_Y}
                      width={TOK_W}
                      height={TOK_H}
                      rx={7}
                      fill={fill}
                      opacity={op}
                      stroke={judged ? 'none' : colors.MUTED}
                      strokeWidth={1.5}
                    />
                    <text
                      x={STRIP_X + i * (TOK_W + 12) + TOK_W / 2}
                      y={STRIP_Y + TOK_H / 2 + 5}
                      textAnchor="middle"
                      fill={judged ? colors.BG : colors.MUTED}
                      fontSize={13}
                      fontFamily="monospace"
                      opacity={judged && !isAccepted && verifyProg >= 1 ? 0.7 : 1}
                    >
                      {judged ? (isAccepted ? 'kept' : 'cut') : `guess ${i + 1}`}
                    </text>
                  </g>
                );
              })}
              {/* the big model's own token, granted at the end of the wave */}
              {verifyProg * (K + 1) > K && (
                <g opacity={clamp01(verifyProg * (K + 1) - K)}>
                  <rect
                    x={STRIP_X + accepted * (TOK_W + 12)}
                    y={STRIP_Y + TOK_H + 16}
                    width={TOK_W + 26}
                    height={TOK_H}
                    rx={7}
                    fill={colors.ACCENT}
                    opacity={0.9}
                  />
                  <text
                    x={STRIP_X + accepted * (TOK_W + 12) + (TOK_W + 26) / 2}
                    y={STRIP_Y + TOK_H + 16 + TOK_H / 2 + 5}
                    textAnchor="middle"
                    fill={colors.BG}
                    fontSize={12}
                    fontFamily="monospace"
                  >
                    +1 verified
                  </text>
                </g>
              )}
              {/* banked counter */}
              <text x={STRIP_X} y={STRIP_Y + 130} fill={colors.WARM} fontSize={15} fontFamily="monospace" fontWeight={700}>
                tokens banked: {banked} · big-model passes: {Math.min(3, roundIdx + (verifyProg >= 1 ? 1 : 0))}
              </text>
              {bankU > 0 && (
                <text x={STRIP_X} y={STRIP_Y + 158} fill={colors.MUTED} fontSize={13} opacity={bankU}>
                  runs {DEMO_RUNS.map((a) => `${a} kept`).join(' · ')} — straight from the seeded simulation
                </text>
              )}
            </g>
          )}

          {/* the histogram of 2000 rounds */}
          {histU > 0 && (
            <g opacity={Math.min(1, histU * 2)}>
              <text x={HIST_X(-0.5)} y={300} fill={colors.TEXT} fontSize={15}>
                guesses kept per pass, {ROUNDS.toLocaleString()} rounds
              </text>
              <Axes
                x={HIST_X}
                y={HIST_Y}
                reveal={histU}
                xTicks={5}
                yTicks={4}
                fontSize={10}
              />
              {HIST.map((n, i) => {
                const h = (HIST_Y(0) - HIST_Y(n)) * histU;
                return (
                  <g key={i}>
                    <rect
                      x={HIST_X(i) - 26}
                      y={HIST_Y(0) - h}
                      width={52}
                      height={h}
                      rx={3}
                      fill={i === K ? colors.POSITIVE : colors.ACCENT}
                      opacity={0.8}
                    />
                    <text x={HIST_X(i)} y={HIST_Y(0) - h - 8} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                      {n}
                    </text>
                  </g>
                );
              })}
              {mathU > 0 && (
                <text x={HIST_X(-0.5)} y={608} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={mathU}>
                  closed form {EXPECTED.toFixed(3)} tok/pass · measured {SIM_MEAN.toFixed(3)}
                </text>
              )}
            </g>
          )}

          {/* the honest bill */}
          {costU > 0 && (
            <g opacity={costU}>
              <text x={220} y={520} fill={colors.TEXT} fontSize={15}>
                the bill per round
              </text>
              <text x={220} y={550} fill={colors.SECONDARY} fontSize={15} fontFamily="monospace">
                {K} drafts × {DRAFT_COST.toFixed(1)} + 1 verify = {(1 + K * DRAFT_COST).toFixed(1)} passes
              </text>
              <text x={220} y={578} fill={colors.WARM} fontSize={16} fontFamily="monospace" fontWeight={700}>
                {SIM_MEAN.toFixed(2)} tokens ÷ {(1 + K * DRAFT_COST).toFixed(1)} = {SPEEDUP.toFixed(2)}× faster
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Guess four, check once
        </text>
      </g>
      <MathLabel
        tex="\mathbb{E}[\text{tokens/pass}] = \sum_{i=0}^{k} p^i"
        x={920}
        y={54}
        fontSize={19}
        color={colors.SECONDARY}
        opacity={mathU * mainOp}
      />

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Cheap guesses, one expensive check.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            2.77 tokens per pass at 70% agreement, ≈ 2× end to end —
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and the big model still gets the final word on every token.
          </text>
        </g>
      )}
    </>
  );
}

export function InferenceSpeculative() {
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
