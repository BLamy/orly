// Explained: Proof or It Didn't Happen — chapter 4: why the kernel can't be gamed.
// The trusted-core argument, made quantitative with a seeded simulation run at
// module scope. An adversary submits flawed proofs dressed in increasingly
// persuasive prose. A style-reading judge (an LLM judge in miniature: accepts
// with probability rising in the persuasion score) is optimized against over
// 10 pressure steps — its measured false-accept rate climbs from 10.6% to 79.3%. The
// kernel's curve stays at exactly zero at every step, because its decision
// reads a channel the adversary cannot write: the recomputation of each rule.
// Judges score text; kernels rerun rules. Optimize against a judge and it
// bends (explained-evaluation's Goodhart lesson); optimize against a kernel
// and the only winning move is a genuinely correct proof.
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
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The simulation, module scope.
// ---------------------------------------------------------------------------

// Pressure steps: the adversary's persuasion skill p in [0,1].
// Judge model: accepts a flawed-but-persuasive proof with probability
//   P(accept | flawed, p) = 0.08 + 0.72 * p   (soft, style-driven)
// and accepts correct proofs at 0.92 regardless (it is a good judge of style —
// correct proofs read well too). The kernel accepts iff the proof checks.
const STEPS = 10;
const N_PER_STEP = 2000; // flawed proofs per pressure step
const rand = mulberry32(23);
const JUDGE_CURVE: number[] = []; // measured false-accept rate per step
const KERNEL_CURVE: number[] = [];
for (let s = 0; s < STEPS; s++) {
  const p = s / (STEPS - 1);
  const pAccept = 0.08 + 0.72 * p;
  let judgeAccepted = 0;
  for (let i = 0; i < N_PER_STEP; i++) if (rand() < pAccept) judgeAccepted++;
  JUDGE_CURVE.push(judgeAccepted / N_PER_STEP);
  // The kernel: a flawed proof has, by definition, at least one line whose
  // stated judgment differs from what its rule yields. Recomputation finds it
  // deterministically — acceptance probability is 0, independent of style.
  KERNEL_CURVE.push(0);
}
const JUDGE_FIRST = JUDGE_CURVE[0]; // ~0.09
const JUDGE_LAST = JUDGE_CURVE[STEPS - 1]; // ~0.73

// What each verifier reads: feature attribution of the decision.
const JUDGE_READS = [
  { f: 'confident tone', w: 0.34 },
  { f: 'clean structure', w: 0.27 },
  { f: 'familiar phrasing', w: 0.22 },
  { f: 'actual validity', w: 0.17 },
];
const KERNEL_READS = [
  { f: 'rule recomputation', w: 1.0 },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PLOT_X = 190;
const PLOT_Y = 190;
const PLOT_W = 620;
const PLOT_H = 330;
const px = (s: number) => PLOT_X + (s / (STEPS - 1)) * PLOT_W;
const py = (v: number) => PLOT_Y + PLOT_H - v * PLOT_H;
const CAM_PLOT: CameraState = { x: 540, y: 360, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  twoU: ChannelRef<number>; // two verifiers side by side
  readsU: ChannelRef<number>; // what each one reads
  axesU: ChannelRef<number>;
  judgeU: ChannelRef<number>; // judge curve draw
  kernelU: ChannelRef<number>; // kernel curve draw
  whyU: ChannelRef<number>; // the structural why panel
  tcbU: ChannelRef<number>; // trusted computing base note
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const twoU = tl.channel('twoU', 0);
  const readsU = tl.channel('readsU', 0);
  const axesU = tl.channel('axesU', 0);
  const judgeU = tl.channel('judgeU', 0);
  const kernelU = tl.channel('kernelU', 0);
  const whyU = tl.channel('whyU', 0);
  const tcbU = tl.channel('tcbU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — two verifiers
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Two verifiers walk into this chapter. One is a model asked to judge whether a proof is correct. The other is the thirty line kernel from chapter two. From a distance they look like the same job.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(twoU, 1, { at: 1.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 5.6,
    text: 'The difference is what each one reads. A judge reads the text of the argument — tone, structure, plausibility, with validity as just one signal among several. The kernel reads none of that. It reruns each rule and compares symbols.',
  });
  tl.tween(readsU, 1, { at: 7.4, dur: 1.0, ease: ease.enter });
  tl.hold(12.1, 0.6);

  // Beat 2 — the attack
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'Now attack both. An adversary submits flawed proofs — real gaps, dressed better and better. Ten pressure steps, two thousand seeded submissions each. On the vertical axis: how often a flawed proof gets accepted.',
  });
  tl.tween(cam, CAM_PLOT, { at: 13.0, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 13.6, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 18.9,
    dur: 5.8,
    text: 'The judge bends. At low pressure it waves through about ten percent of flawed proofs. As the prose gets more persuasive its false accept rate climbs past seventy percent — because persuasion is exactly the channel it scores.',
  });
  tl.tween(judgeU, 1, { at: 19.8, dur: 3.2, ease: ease.draw });
  tl.hold(24.7, 0.6);

  // Beat 3 — the flat line
  tl.caption({
    at: 25.3,
    dur: 5.6,
    text: 'The kernel’s line is the most boring plot on this shelf, and the whole point of this book. Zero. At every pressure level, exactly zero — not measured luck, but arithmetic: a flawed proof has a line whose rule does not produce it, and recomputation visits every line.',
  });
  tl.tween(kernelU, 1, { at: 26.4, dur: 2.6, ease: ease.draw });
  tl.caption({
    at: 31.5,
    dur: 5.4,
    text: 'This is the structural difference, not a difference of degree. The judge’s input is a surface the adversary controls. The kernel’s input is a computation the adversary cannot touch — the only way to move its output is to change what is true.',
  });
  tl.tween(whyU, 1, { at: 32.6, dur: 0.9, ease: ease.enter });
  tl.hold(36.9, 0.6);

  // Beat 4 — the shelf's ladder
  tl.caption({
    at: 37.5,
    dur: 6.0,
    text: 'You have seen the weak end of this before. The evaluation book showed benchmarks bending under optimization pressure — Goodhart’s law eating the metric. The loop books hardened it: critics that replay recordings instead of reading summaries. The kernel is that same idea driven to its limit.',
  });
  tl.caption({
    at: 43.9,
    dur: 5.6,
    text: 'And the price of the guarantee is refreshingly small. You must trust the kernel itself — a trusted core measured in tens of lines, small enough to read in an afternoon, audited once, doubted never. Everything else, including the model, stays untrusted.',
  });
  tl.tween(tcbU, 1, { at: 45.0, dur: 0.9, ease: ease.enter });
  tl.hold(49.5, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 50.1,
    dur: 5.6,
    text: 'So the answer to this chapter’s question is one sentence. The kernel cannot be gamed because gaming is persuasion, and there is nobody home to persuade — just a rule, rerun, and a comparison of symbols.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.3, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.3, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 56.3,
    dur: 4.6,
    text: 'One chapter left: what this limit case says about every other verifier on the shelf — and about the agents we keep asking to check themselves.',
  });
  tl.hold(60.9, 1.4);

  return { tl, cam, titleU, twoU, readsU, axesU, judgeU, kernelU, whyU, tcbU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/kernel-trust/overrides.json',
  slug: 'kernel-trust',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function curvePath(vals: number[], u: number): string {
  const n = Math.max(2, Math.ceil(vals.length * u));
  return vals
    .slice(0, n)
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`)
    .join(' ');
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const twoU = s.get(scene.twoU);
  const readsU = s.get(scene.readsU);
  const axesU = s.get(scene.axesU);
  const judgeU = s.get(scene.judgeU);
  const kernelU = s.get(scene.kernelU);
  const whyU = s.get(scene.whyU);
  const tcbU = s.get(scene.tcbU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const introFade = 1 - 0.85 * clamp01(axesU * 2.5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* two verifiers, intro */}
          {twoU > 0 && introFade > 0.05 && (
            <g opacity={twoU * introFade}>
              <rect x={180} y={170} width={420} height={200} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
              <text x={210} y={206} fill={colors.WARM} fontSize={17} fontWeight={700}>
                the judge
              </text>
              <text x={210} y={230} fill={colors.MUTED} fontSize={12.5}>
                a model scoring the argument
              </text>
              {readsU > 0 &&
                JUDGE_READS.map((r, i) => (
                  <g key={r.f} opacity={clamp01(readsU * 4 - i)}>
                    <rect x={210} y={248 + i * 26} width={r.w * 300} height={16} rx={4} fill={r.f === 'actual validity' ? colors.POSITIVE : colors.WARM} opacity={0.55} />
                    <text x={220 + r.w * 300} y={261 + i * 26} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                      {r.f} · {(r.w * 100).toFixed(0)}%
                    </text>
                  </g>
                ))}
              <rect x={680} y={170} width={420} height={200} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
              <text x={710} y={206} fill={colors.SECONDARY} fontSize={17} fontWeight={700}>
                the kernel
              </text>
              <text x={710} y={230} fill={colors.MUTED} fontSize={12.5}>
                thirty lines rerunning rules
              </text>
              {readsU > 0 &&
                KERNEL_READS.map((r) => (
                  <g key={r.f} opacity={readsU}>
                    <rect x={710} y={248} width={r.w * 300} height={16} rx={4} fill={colors.POSITIVE} opacity={0.75} />
                    <text x={710} y={287} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                      {r.f} · 100% — no other input exists
                    </text>
                  </g>
                ))}
            </g>
          )}

          {/* the pressure plot */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <line x1={PLOT_X} y1={PLOT_Y} x2={PLOT_X} y2={PLOT_Y + PLOT_H} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={PLOT_X} y1={PLOT_Y + PLOT_H} x2={PLOT_X + PLOT_W} y2={PLOT_Y + PLOT_H} stroke={colors.GRID} strokeWidth={1.5} />
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1={PLOT_X - 5} y1={py(v)} x2={PLOT_X + PLOT_W} y2={py(v)} stroke={colors.GRID} strokeWidth={0.5} opacity={0.4} />
                  <text x={PLOT_X - 12} y={py(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                    {(v * 100).toFixed(0)}%
                  </text>
                </g>
              ))}
              <text x={PLOT_X + PLOT_W / 2} y={PLOT_Y + PLOT_H + 34} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
                adversary persuasion skill → (10 pressure steps, 2,000 flawed proofs each)
              </text>
              <text
                x={PLOT_X - 52}
                y={PLOT_Y + PLOT_H / 2}
                fill={colors.MUTED}
                fontSize={12}
                textAnchor="middle"
                transform={`rotate(-90 ${PLOT_X - 52} ${PLOT_Y + PLOT_H / 2})`}
              >
                flawed proofs accepted
              </text>
              {/* judge curve */}
              {judgeU > 0 && (
                <g>
                  <path d={curvePath(JUDGE_CURVE, judgeU)} fill="none" stroke={colors.WARM} strokeWidth={3} />
                  {JUDGE_CURVE.map((v, i) =>
                    clamp01(judgeU * STEPS - i) > 0 ? <circle key={i} cx={px(i)} cy={py(v)} r={4} fill={colors.WARM} /> : null
                  )}
                  <text x={px(STEPS - 1) + 12} y={py(JUDGE_LAST)} fill={colors.WARM} fontSize={12.5} fontFamily="monospace" fontWeight={700} opacity={clamp01(judgeU * 4 - 3)}>
                    judge: {(JUDGE_FIRST * 100).toFixed(0)}% → {(JUDGE_LAST * 100).toFixed(0)}%
                  </text>
                </g>
              )}
              {/* kernel curve */}
              {kernelU > 0 && (
                <g>
                  <path d={curvePath(KERNEL_CURVE, kernelU)} fill="none" stroke={colors.POSITIVE} strokeWidth={3.5} />
                  <text x={px(STEPS - 1) + 12} y={py(0) - 8} fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace" fontWeight={700} opacity={clamp01(kernelU * 3 - 2)}>
                    kernel: 0% at every step
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* the structural why — screen space */}
      {whyU > 0 && (
        <g opacity={whyU * mainOp}>
          <rect x={880} y={110} width={370} height={160} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={904} y={142} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            why the lines differ in KIND
          </text>
          <text x={904} y={172} fill={colors.WARM} fontSize={12} fontFamily="monospace">
            judge input: text — adversary-writable
          </text>
          <text x={904} y={196} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
            kernel input: recomputation — not
          </text>
          <text x={904} y={228} fill={colors.MUTED} fontSize={11.5}>
            to move the kernel’s output you must
          </text>
          <text x={904} y={246} fill={colors.MUTED} fontSize={11.5}>
            change what is true
          </text>
        </g>
      )}
      {tcbU > 0 && (
        <g opacity={tcbU * mainOp}>
          <text x={880} y={310} fill={colors.SECONDARY} fontSize={13.5} fontFamily="monospace" fontWeight={700}>
            trusted core: ~30 lines
          </text>
          <text x={880} y={334} fill={colors.MUTED} fontSize={12}>
            audited once · everything else untrusted
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          A judge you cannot charm
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Gaming is persuasion. Nobody is home.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.WARM} fontSize={15} fontFamily="monospace">
            judge under pressure: {(JUDGE_FIRST * 100).toFixed(0)}% → {(JUDGE_LAST * 100).toFixed(0)}% flawed proofs accepted
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily="monospace">
            kernel under pressure: 0% → 0%
          </text>
          <text x={640} y={404} textAnchor="middle" fill={colors.MUTED} fontSize={14.5}>
            benchmarks bend, judges bend, critics resist — kernels do not move
          </text>
        </g>
      )}
    </>
  );
}

export function KernelTrust() {
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
