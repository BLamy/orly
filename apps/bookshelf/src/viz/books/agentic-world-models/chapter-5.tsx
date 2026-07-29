// Book scene — agentic-world-models, chapter 5 (closing/recap chapter)
//
// Grounding: Cameron R. Wolfe's Substack essay "Agentic World Models" (July
// 2026), the section on Qwen-AgentWorld and its SimRL payoff. Chapters 1-4
// (not authored here) covered sparse rewards, the token-mask trick that
// blends world-modeling INTO the policy model, ECHO / "True Agents Model the
// World", and PaW's three interventions. This paper takes a different turn:
// instead of one model wearing two hats, Qwen-AgentWorld trains a second,
// wholly separate network — a twin — whose only job is to predict what a
// real environment will do, across seven domains (terminals, web search,
// MCP tool servers controlled "as code", and others). Three training
// stages: (1) continual pretraining on raw observation prediction, filtered
// by informativeness / novelty / predictability / action-observation
// correlation; (2) supervised fine-tuning that adds reasoning traces via
// rejection sampling, curated to 7,094 trajectories; (3) reinforcement
// learning with GSPO (group sequence policy optimization) against a
// five-dimension rubric (format, factuality, consistency, realism, quality)
// blended nine-to-one with verifiable executable checks — exact match for
// deterministic output, structural match for run-varying metadata — plus
// deliberate perturbations (errors, pagination) and anti-collapse resampling
// controls. Ships AgentWorldBench (2,170 trajectories, same seven domains).
// The payoff, SimRL: the trained twin is faithful enough to substitute for
// the real environment during policy training (matches/exceeds real-env
// training in the search domain) — but a generic, not-specially-trained
// model used the same way yields no gain at all. Closes with a recap of the
// whole book's arc.
//
// Centerpiece: a ring of seven domain clusters. The REAL environment sits
// fixed in that ring; a TWIN particle cloud starts as undifferentiated noise
// and, across the three training-stage zones, converges onto the exact same
// ring — literally learning to mirror the real thing. The SimRL beat swaps
// which node the training loop's packet visits (real fades, twin fades in,
// the loop keeps moving) versus a failed swap into a generic model (the loop
// stalls into jitter). Closes on a quiet recap of the book's five chapters.
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';
import type { ParticlePoint } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TAU = Math.PI * 2;
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ---------------------------------------------------------------------------
// The seven-domain ring — the shared centerpiece geometry.
// ---------------------------------------------------------------------------
const RING = { x: 420, y: 300, r: 148 };
const N_PER_CLUSTER = 34;
const N_CLUSTERS = 7;
const DOMAIN_LABELS: Array<string | null> = [
  'terminals',
  'web search',
  'MCP tool servers',
  null,
  null,
  null,
  null,
];

interface Dot {
  cluster: number;
  realX: number;
  realY: number;
  scatterX: number;
  scatterY: number;
  jitterA: number;
  jitterR: number;
}
const DOTS: Dot[] = (() => {
  const rand = mulberry32(917);
  const out: Dot[] = [];
  for (let c = 0; c < N_CLUSTERS; c++) {
    const ang = (c / N_CLUSTERS) * TAU - Math.PI / 2;
    const cx = RING.x + Math.cos(ang) * RING.r;
    const cy = RING.y + Math.sin(ang) * RING.r * 0.86;
    for (let i = 0; i < N_PER_CLUSTER; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 26;
      out.push({
        cluster: c,
        realX: cx + Math.cos(a) * d,
        realY: cy + Math.sin(a) * d,
        scatterX: RING.x + (rand() - 0.5) * 2 * (RING.r + 90),
        scatterY: RING.y + (rand() - 0.5) * 2 * (RING.r + 90) * 0.86,
        jitterA: rand() * TAU,
        jitterR: 10 + rand() * 30,
      });
    }
  }
  return out;
})();

function clusterCenter(c: number): { x: number; y: number } {
  const ang = (c / N_CLUSTERS) * TAU - Math.PI / 2;
  return { x: RING.x + Math.cos(ang) * RING.r, y: RING.y + Math.sin(ang) * RING.r * 0.86 };
}

// twin cloud: scattered noise → real ring, tightening as stageU goes 0..1
function twinPoints(stageU: number, wobbleT: number): ParticlePoint[] {
  const t = ease.move(clamp01(stageU));
  const settle = clamp01(stageU); // jitter shrink follows raw progress
  return DOTS.map((d, i) => {
    const stagger = clamp01((t - i * 0.00025) / (1 - i * 0.00025 + 1e-6));
    const x = lerp(d.scatterX, d.realX, stagger);
    const y = lerp(d.scatterY, d.realY, stagger);
    const wob = (1 - settle) * 16;
    const wx = Math.cos(d.jitterA + wobbleT * TAU * 0.6) * wob;
    const wy = Math.sin(d.jitterA * 1.3 + wobbleT * TAU * 0.6) * wob;
    return { x: x + wx, y: y + wy, r: 2.1, alpha: 0.85 };
  });
}
function realPoints(alpha: number): ParticlePoint[] {
  return DOTS.map((d) => ({ x: d.realX, y: d.realY, r: 2.1, alpha }));
}

// ---------------------------------------------------------------------------
// SimRL loop geometry — policy ⇄ environment, small orbiting packet.
// ---------------------------------------------------------------------------
const LOOP_POLICY = { x: 860, y: 470 };
const LOOP_ENV = { x: 1080, y: 470 };
function loopPoint(t: number): { x: number; y: number } {
  // simple stadium loop between the two nodes
  const u = ((t % 1) + 1) % 1;
  const top = u < 0.5;
  const seg = top ? u / 0.5 : (u - 0.5) / 0.5;
  const y = top ? LOOP_POLICY.y - 46 : LOOP_POLICY.y + 46;
  const x = top ? lerp(LOOP_POLICY.x, LOOP_ENV.x, seg) : lerp(LOOP_ENV.x, LOOP_POLICY.x, seg);
  return { x, y };
}

const CAM_RING: CameraState = { x: 430, y: 300, k: 1.32 };
const CAM_LOOP: CameraState = { x: 940, y: 460, k: 1.4 };
const CAM_RECAP: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const introU = tl.channel('introU', 0); // opening line card
  const twinLabelU = tl.channel('twinLabelU', 0);
  const realU = tl.channel('realU', 0.55); // real ring visibility
  const stageU = tl.channel('stageU', 0); // 0..1 twin convergence across all 3 stages
  const wobbleT = tl.channel('wobbleT', 0); // linear clock for jitter
  const railU = tl.channel('railU', 0); // three-phase rail draw-on
  const phase1U = tl.channel('phase1U', 0);
  const phase2U = tl.channel('phase2U', 0);
  const phase3U = tl.channel('phase3U', 0);
  const domainLabelU = tl.channel('domainLabelU', 0);
  const filterChipU = tl.channel('filterChipU', 0);
  const traceChipU = tl.channel('traceChipU', 0);
  const rubricChipU = tl.channel('rubricChipU', 0);
  const ratioU = tl.channel('ratioU', 0); // 9:1 donut draw
  const matchChipU = tl.channel('matchChipU', 0);
  const perturbU = tl.channel('perturbU', 0);
  const benchU = tl.channel('benchU', 0);

  const ringToLoopU = tl.channel('ringToLoopU', 0); // crossfade ring → loop scene
  const loopT = tl.channel('loopT', 0); // orbiting packet clock (linear)
  const envSwapU = tl.channel('envSwapU', 0); // 0 real, 1 twin
  const failU = tl.channel('failU', 0); // failed generic-swap variant
  const resultChipU = tl.channel('resultChipU', 0);

  const recapU = tl.channel('recapU', 0); // fades everything, opaque backdrop
  const r1U = tl.channel('r1U', 0);
  const r2U = tl.channel('r2U', 0);
  const r3U = tl.channel('r3U', 0);
  const r4U = tl.channel('r4U', 0);
  const r5U = tl.channel('r5U', 0);

  // wobble clock runs the whole scene
  tl.tween(wobbleT, 1, { at: 0, dur: 130, ease: ease.linear });

  // — beat 1 · a different move —
  tl.caption({
    at: 0.5,
    dur: 7.4,
    text: "Every chapter so far taught one model to imagine the world by folding that skill into its own token stream. This last paper tries something else.",
  });
  tl.tween(introU, 1, { at: 0.7, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_RING, { at: 1.0, dur: 1.6, ease: ease.move });
  tl.hold(8.2, 0.6);

  // — beat 2 · the twin —
  tl.caption({
    at: 8.8,
    dur: 6.6,
    text: 'Qwen Agent World trains a second, separate network — a twin — whose only job is predicting what the real environment will do.',
  });
  tl.tween(introU, 0, { at: 9.0, dur: 0.7, ease: ease.enter });
  tl.tween(twinLabelU, 1, { at: 9.4, dur: 0.8, ease: ease.enter });
  tl.tween(realU, 0.85, { at: 9.4, dur: 1.0, ease: ease.enter });
  tl.hold(15.6, 0.5);

  // — beat 3 · seven domains —
  tl.caption({
    at: 16.1,
    dur: 6.8,
    text: "That twin is not built for one task. It trains across seven domains — terminals, web search, tool servers it controls like code, and more.",
  });
  tl.tween(domainLabelU, 1, { at: 16.4, dur: 1.2, ease: ease.enter });
  tl.tween(railU, 1, { at: 16.6, dur: 1.2, ease: ease.draw });
  tl.hold(23.1, 0.5);

  // — beat 4 · stage 1: pretraining —
  tl.caption({
    at: 23.6,
    dur: 7.6,
    text: "Stage one is continual pretraining: no reasoning yet, just predict the next observation, from transitions that are informative, novel, predictable, and tied to the action that caused them.",
  });
  tl.tween(phase1U, 1, { at: 23.8, dur: 0.7, ease: ease.enter });
  tl.tween(filterChipU, 1, { at: 25.6, dur: 0.7, ease: ease.enter });
  tl.tween(stageU, 0.33, { at: 24.4, dur: 6.0, ease: ease.move });
  tl.hold(31.4, 0.5);

  // — beat 5 · stage 2: reasoning-trace SFT —
  tl.caption({
    at: 31.9,
    dur: 7.6,
    text: 'Stage two adds reasoning: the twin thinks through what the environment will do before it answers, trained on seven thousand ninety four curated trajectories picked by rejection sampling.',
  });
  tl.tween(filterChipU, 0, { at: 32.1, dur: 0.5, ease: ease.enter });
  tl.tween(phase2U, 1, { at: 32.3, dur: 0.7, ease: ease.enter });
  tl.tween(traceChipU, 1, { at: 34.4, dur: 0.7, ease: ease.enter });
  tl.tween(stageU, 0.66, { at: 32.6, dur: 6.4, ease: ease.move });
  tl.hold(39.7, 0.5);

  // — beat 6 · stage 3: RL with the rubric —
  tl.caption({
    at: 40.2,
    dur: 7.8,
    text: 'Stage three is reinforcement learning with group sequence policy optimization, scored on five dimensions: format, factuality, consistency, realism, and quality.',
  });
  tl.tween(traceChipU, 0, { at: 40.4, dur: 0.5, ease: ease.enter });
  tl.tween(phase3U, 1, { at: 40.6, dur: 0.7, ease: ease.enter });
  tl.tween(rubricChipU, 1, { at: 43.0, dur: 0.8, ease: ease.enter });
  tl.tween(stageU, 1, { at: 40.9, dur: 6.6, ease: ease.move });
  tl.hold(48.4, 0.5);

  // — beat 7 · the nine-to-one blend —
  tl.caption({
    at: 48.9,
    dur: 7.4,
    text: "That score is a blend: nine parts rubric judgment to one part verifiable execution, because a language-model judge can be gamed and a hard check cannot.",
  });
  tl.tween(rubricChipU, 0, { at: 49.1, dur: 0.5, ease: ease.enter });
  tl.tween(cam, CAM_RING, { at: 49.1, dur: 1.2, ease: ease.move });
  tl.tween(ratioU, 1, { at: 49.6, dur: 2.0, ease: ease.draw });
  tl.hold(56.3, 0.5);

  // — beat 8 · exact vs structural match, and the mess —
  tl.caption({
    at: 56.8,
    dur: 8.0,
    text: "Exact terminal output has to match exactly. A timestamp only has to match in shape, since that changes every run. And training injects real messiness — errors, pagination — on purpose.",
  });
  tl.tween(matchChipU, 1, { at: 57.2, dur: 0.8, ease: ease.enter });
  tl.tween(perturbU, 1, { at: 60.4, dur: 1.4, ease: ease.enter });
  tl.hold(64.8, 0.5);

  // — beat 9 · the benchmark —
  tl.caption({
    at: 65.3,
    dur: 6.4,
    text: 'The result ships its own exam: agent world bench, two thousand one hundred seventy trajectories across those same seven domains.',
  });
  tl.tween(matchChipU, 0, { at: 65.5, dur: 0.5, ease: ease.enter });
  tl.tween(perturbU, 0, { at: 65.5, dur: 0.5, ease: ease.enter });
  tl.tween(ratioU, 0.2, { at: 65.5, dur: 0.8, ease: ease.enter });
  tl.tween(benchU, 1, { at: 66.3, dur: 0.8, ease: ease.enter });
  tl.hold(71.7, 0.5);

  // — beat 10 · SimRL: the swap —
  tl.caption({
    at: 72.2,
    dur: 7.4,
    text: "Now the payoff, called Sim R L. Once trained, this twin is convincing enough to replace the real environment inside the training loop.",
  });
  tl.tween(cam, CAM_LOOP, { at: 72.4, dur: 1.6, ease: ease.move });
  tl.tween(ringToLoopU, 1, { at: 72.6, dur: 1.4, ease: ease.enter });
  tl.tween(loopT, 4, { at: 72.6, dur: 60, ease: ease.linear });
  tl.hold(79.6, 0.5);

  tl.tween(envSwapU, 1, { at: 80.1, dur: 2.2, ease: ease.move });
  // — beat 11 · it actually works —
  tl.caption({
    at: 80.1,
    dur: 6.8,
    text: 'The policy trains against the simulation instead of the real thing, and in the search domain it matches or beats training against reality itself.',
  });
  tl.tween(resultChipU, 1, { at: 83.6, dur: 0.8, ease: ease.enter });
  tl.hold(87.4, 0.5);

  // — beat 12 · the failed swap —
  tl.caption({
    at: 87.9,
    dur: 8.2,
    text: "Swap in an ordinary model that was never trained this way and nothing happens — it does not know the environment well enough, so there is no gain to learn from.",
  });
  tl.tween(resultChipU, 0, { at: 88.1, dur: 0.5, ease: ease.enter });
  tl.tween(failU, 1, { at: 88.6, dur: 2.4, ease: ease.enter });
  tl.hold(96.6, 0.6);

  // — beat 13 · recap: zoom out, sparse reward + mask —
  tl.caption({
    at: 97.3,
    dur: 8.4,
    text: "Zoom all the way out. Sparse reward made looking ahead too costly to learn, so a mask folded that foresight straight into the policy's own loss.",
  });
  tl.tween(recapU, 1, { at: 97.5, dur: 1.6, ease: ease.move });
  tl.tween(cam, CAM_RECAP, { at: 97.5, dur: 1.8, ease: ease.move });
  tl.tween(r1U, 1, { at: 98.6, dur: 0.9, ease: ease.enter });
  tl.tween(r2U, 1, { at: 100.6, dur: 0.9, ease: ease.enter });
  tl.hold(105.7, 0.6);

  // — beat 14 · recap: echo + paw —
  tl.caption({
    at: 106.3,
    dur: 8.6,
    text: 'Echo showed that gain was real, if you watched for overfitting, and paw tuned three dials — entropy, a clipped error, and a moving balance — to keep it honest.',
  });
  tl.tween(r3U, 1, { at: 106.8, dur: 0.9, ease: ease.enter });
  tl.tween(r4U, 1, { at: 108.8, dur: 0.9, ease: ease.enter });
  tl.hold(114.9, 0.6);

  // — beat 15 · recap close: the twin —
  tl.caption({
    at: 115.5,
    dur: 8.4,
    text: 'This chapter went further still — a whole second brain, trained to dream the environment well enough that you can learn from the dream itself.',
  });
  tl.tween(r5U, 1, { at: 116.0, dur: 1.0, ease: ease.enter });
  tl.hold(124.5, 2.0);

  return {
    tl,
    cam,
    introU,
    twinLabelU,
    realU,
    stageU,
    wobbleT,
    railU,
    phase1U,
    phase2U,
    phase3U,
    domainLabelU,
    filterChipU,
    traceChipU,
    rubricChipU,
    ratioU,
    matchChipU,
    perturbU,
    benchU,
    ringToLoopU,
    loopT,
    envSwapU,
    failU,
    resultChipU,
    recapU,
    r1U,
    r2U,
    r3U,
    r4U,
    r5U,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------
function Chip({
  x,
  y,
  text,
  color,
  u,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  u: number;
}) {
  if (u <= 0.01) return null;
  const w = text.length * 6.7 + 22;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 14} width={w} height={27} rx={8} fill={colors.BG} stroke={color} strokeOpacity={0.7} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={11.5} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

function RecapLine({ y, text, u }: { y: number; text: string; u: number }) {
  if (u <= 0.01) return null;
  return (
    <text
      x={STAGE_W / 2}
      y={y}
      textAnchor="middle"
      fill={colors.TEXT}
      fontSize={19}
      opacity={u}
      transform={`translate(0 ${10 * (1 - u)})`}
    >
      {text}
    </text>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const introU = s.get(scene.introU);
  const twinLabelU = s.get(scene.twinLabelU);
  const realU = s.get(scene.realU);
  const stageU = s.get(scene.stageU);
  const wobbleT = s.get(scene.wobbleT);
  const railU = s.get(scene.railU);
  const phase1U = s.get(scene.phase1U);
  const phase2U = s.get(scene.phase2U);
  const phase3U = s.get(scene.phase3U);
  const domainLabelU = s.get(scene.domainLabelU);
  const filterChipU = s.get(scene.filterChipU);
  const traceChipU = s.get(scene.traceChipU);
  const rubricChipU = s.get(scene.rubricChipU);
  const ratioU = s.get(scene.ratioU);
  const matchChipU = s.get(scene.matchChipU);
  const perturbU = s.get(scene.perturbU);
  const benchU = s.get(scene.benchU);
  const ringToLoopU = s.get(scene.ringToLoopU);
  const loopT = s.get(scene.loopT);
  const envSwapU = s.get(scene.envSwapU);
  const failU = s.get(scene.failU);
  const resultChipU = s.get(scene.resultChipU);
  const recapU = s.get(scene.recapU);
  const r1U = s.get(scene.r1U);
  const r2U = s.get(scene.r2U);
  const r3U = s.get(scene.r3U);
  const r4U = s.get(scene.r4U);
  const r5U = s.get(scene.r5U);

  const ringDim = 1 - recapU; // ring/rail dims for both loop-scene and recap
  const ringOpacity = ringDim * (1 - 0.85 * ringToLoopU);
  const loopOpacity = ringToLoopU * ringDim;

  // donut geometry for the 9:1 blend
  const donutC = { x: 700, y: 300, r: 46 };
  const CIRC = TAU * donutC.r;
  const rubricFrac = 0.9;
  const p = loopPoint(loopT);
  const failNode = { x: 1080, y: 610 };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- ring scene ---------------- */}
        <g opacity={ringOpacity}>
          {/* three-phase rail */}
          {railU > 0.01 && (
            <g opacity={railU}>
              <text x={160} y={70} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                three training stages
              </text>
              {(['pretraining', 'reasoning SFT', 'RL rubric'] as const).map((label, i) => {
                const lit = i === 0 ? phase1U : i === 1 ? phase2U : phase3U;
                const x = 160 + i * 210;
                return (
                  <g key={label}>
                    <rect
                      x={x}
                      y={82}
                      width={190}
                      height={32}
                      rx={8}
                      fill={colors.PANEL}
                      stroke={i === 0 ? colors.ACCENT : i === 1 ? colors.SECONDARY : colors.WARM}
                      strokeOpacity={0.3 + 0.7 * lit}
                    />
                    <text x={x + 95} y={103} textAnchor="middle" fill={colors.TEXT} fontSize={12} opacity={0.5 + 0.5 * lit}>
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* real environment ring (ground truth) */}
          <ParticleCloud state={s} compute={() => realPoints(realU * 0.6)} r={2.1} color={colors.MUTED} alpha={1} />
          {/* twin cloud converging onto the ring */}
          <ParticleCloud state={s} compute={() => twinPoints(stageU, wobbleT)} r={2.1} color={colors.ACCENT} alpha={1} />

          {twinLabelU > 0.01 && (
            <g opacity={twinLabelU}>
              <text x={RING.x} y={RING.y - RING.r - 30} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                the real environment
              </text>
              <text x={RING.x} y={RING.y + RING.r + 46} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>
                the twin world model
              </text>
            </g>
          )}

          {domainLabelU > 0.01 &&
            DOMAIN_LABELS.map((lab, i) => {
              const c = clusterCenter(i);
              if (!lab) return null;
              return (
                <text
                  key={i}
                  x={c.x}
                  y={c.y - 40}
                  textAnchor="middle"
                  fill={colors.TEXT}
                  fontSize={11.5}
                  fontFamily={MONO}
                  opacity={domainLabelU}
                >
                  {lab}
                </text>
              );
            })}
          {domainLabelU > 0.01 && (
            <text x={RING.x} y={RING.y} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={domainLabelU * 0.85}>
              + four more domains
            </text>
          )}

          <Chip x={RING.x + 260} y={150} text="informative · novel · predictable · action-linked" color={colors.ACCENT} u={filterChipU} />
          <Chip x={RING.x + 260} y={150} text="rejection sampling → 7,094 trajectories" color={colors.SECONDARY} u={traceChipU} />
          <Chip x={RING.x + 260} y={150} text="G S P O · format · factuality · consistency · realism · quality" color={colors.WARM} u={rubricChipU} />

          {/* 9:1 donut */}
          {ratioU > 0.01 && (
            <g opacity={ratioU} transform={`translate(${donutC.x} ${donutC.y})`}>
              <circle r={donutC.r} fill="none" stroke={colors.GRID} strokeWidth={14} />
              <circle
                r={donutC.r}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={14}
                strokeDasharray={`${CIRC * rubricFrac * ratioU} ${CIRC}`}
                transform="rotate(-90)"
              />
              <circle
                r={donutC.r}
                fill="none"
                stroke={colors.NEGATIVE}
                strokeWidth={14}
                strokeDasharray={`${CIRC * (1 - rubricFrac) * ratioU} ${CIRC}`}
                strokeDashoffset={-CIRC * rubricFrac * ratioU}
                transform="rotate(-90)"
              />
              <text y={-6} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                9 : 1
              </text>
              <text y={14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                rubric : executable
              </text>
            </g>
          )}
          <Chip x={donutC.x} y={donutC.y + 90} text="exact match (deterministic) vs structural match (run-varying)" color={colors.WARM} u={matchChipU} />
          <Chip x={donutC.x} y={donutC.y + 122} text="+ injected errors, pagination" color={colors.NEGATIVE} u={perturbU} />

          {benchU > 0.01 && (
            <g opacity={benchU}>
              <rect x={RING.x - 130} y={RING.y + RING.r + 70} width={260} height={54} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.6} />
              <text x={RING.x} y={RING.y + RING.r + 94} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontWeight={600}>
                AgentWorldBench
              </text>
              <text x={RING.x} y={RING.y + RING.r + 112} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                2,170 trajectories · 7 domains
              </text>
            </g>
          )}
        </g>

        {/* ---------------- SimRL loop scene ---------------- */}
        <g opacity={loopOpacity}>
          <rect
            x={LOOP_POLICY.x - 70}
            y={LOOP_POLICY.y - 30}
            width={140}
            height={60}
            rx={12}
            fill={colors.PANEL}
            stroke={colors.SECONDARY}
            strokeWidth={1.8}
          />
          <text x={LOOP_POLICY.x} y={LOOP_POLICY.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
            policy
          </text>

          {/* env node crossfades real → twin */}
          <rect
            x={LOOP_ENV.x - 70}
            y={LOOP_ENV.y - 30}
            width={140}
            height={60}
            rx={12}
            fill={colors.PANEL}
            stroke={colors.MUTED}
            strokeWidth={1.8}
            opacity={1 - envSwapU}
          />
          <text x={LOOP_ENV.x} y={LOOP_ENV.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={13} opacity={1 - envSwapU}>
            real environment
          </text>
          <rect
            x={LOOP_ENV.x - 70}
            y={LOOP_ENV.y - 30}
            width={140}
            height={60}
            rx={12}
            fill={colors.PANEL}
            stroke={colors.ACCENT}
            strokeWidth={1.8}
            opacity={envSwapU}
          />
          <text x={LOOP_ENV.x} y={LOOP_ENV.y - 4} textAnchor="middle" fill={colors.ACCENT} fontSize={13} opacity={envSwapU}>
            twin world model
          </text>
          <text x={LOOP_ENV.x} y={LOOP_ENV.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
            {envSwapU > 0.5 ? 'simulated' : 'real, slow, costly'}
          </text>

          {/* loop rails */}
          <path
            d={`M${LOOP_POLICY.x} ${LOOP_POLICY.y - 46} L${LOOP_ENV.x} ${LOOP_ENV.y - 46}`}
            stroke={colors.GRID}
            strokeWidth={1.6}
          />
          <path
            d={`M${LOOP_ENV.x} ${LOOP_ENV.y + 46} L${LOOP_POLICY.x} ${LOOP_POLICY.y + 46}`}
            stroke={colors.GRID}
            strokeWidth={1.6}
          />
          {failU < 0.5 && <circle cx={p.x} cy={p.y} r={6} fill={envSwapU > 0.5 ? colors.ACCENT : colors.WARM} />}

          <Chip x={970} y={LOOP_POLICY.y - 80} text="policy trains against the twin, not the real thing" color={colors.ACCENT} u={resultChipU} />

          {/* failed generic-model swap, off to the side */}
          {failU > 0.01 && (
            <g opacity={failU}>
              <rect
                x={failNode.x - 80}
                y={failNode.y - 26}
                width={160}
                height={52}
                rx={10}
                fill={colors.PANEL}
                stroke={colors.NEGATIVE}
                strokeWidth={1.6}
                strokeDasharray="5 5"
              />
              <text x={failNode.x} y={failNode.y - 2} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5}>
                generic model
              </text>
              <text x={failNode.x} y={failNode.y + 15} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                never trained on the domain
              </text>
              {/* stalled loop: jittering static, no clean orbit */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * TAU + wobbleT * TAU * 5;
                const jr = 40 + 6 * Math.sin(a * 3);
                return (
                  <circle
                    key={i}
                    cx={failNode.x + Math.cos(a) * jr}
                    cy={failNode.y - 70 + Math.sin(a) * jr * 0.4}
                    r={2}
                    fill={colors.NEGATIVE}
                    opacity={0.7}
                  />
                );
              })}
              <text x={failNode.x} y={failNode.y - 100} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontStyle="italic">
                no gain — the loop stalls
              </text>
            </g>
          )}
        </g>

        {/* ---------------- intro card ---------------- */}
        {introU > 0.01 && (
          <g opacity={introU}>
            <rect x={STAGE_W / 2 - 210} y={70} width={420} height={54} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
            <text x={STAGE_W / 2} y={102} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              a separate twin, not a blended mask
            </text>
          </g>
        )}

        {/* ---------------- recap: quiet stage ---------------- */}
        {recapU > 0.01 && (
          <g>
            <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} opacity={recapU * 0.94} />
            <MathLabel tex={'\\text{sparse reward} \\to \\text{mask} \\to \\text{ECHO} \\to \\text{PaW} \\to \\text{twin}'} x={STAGE_W / 2} y={200} fontSize={22} opacity={recapU * 0.55} color={colors.MUTED} />
            <RecapLine y={300} text="Sparse reward made looking ahead too costly to learn." u={r1U * recapU} />
            <RecapLine y={340} text="A mask folded that foresight into the policy's own loss." u={r2U * recapU} />
            <RecapLine y={380} text="Echo showed the gain was real — if you watched for overfitting." u={r3U * recapU} />
            <RecapLine y={420} text="PaW tuned three dials to keep that gain honest." u={r4U * recapU} />
            <RecapLine y={470} text="And this chapter trained a whole second brain to dream the world." u={r5U * recapU} />
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
