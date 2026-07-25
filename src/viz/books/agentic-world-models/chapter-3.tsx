// Chapter 3 — "The proof: terminals, code, and retrieval"
//
// Grounding: Cameron R. Wolfe's Substack essay "Agentic World Models"
// (July 2026), the chapter covering two empirical papers that apply the
// token-level action/observation masking method established in chapters 1–2
// (RL loss on action tokens, supervised loss on observation tokens, one
// combined objective):
//
//  - ECHO — applies the mask to terminal agents solving Terminal-Bench 2.0
//    (real terminal tasks: fixing configs, running builds, chasing bugs).
//    Roughly doubles pass rate vs plain RL; an 8B model hits plain GRPO's
//    ceiling in 1.5–2.3x fewer steps; timeout rate falls from 19.8% to 9%;
//    gains hold even training on another agent's trajectories.
//
//  - "True Agents Model the World" — the same mask studied across forth-lang
//    (unfamiliar but PREDICTABLE code — deterministic, learnable outputs)
//    and deepdive (retrieval-heavy — mechanically simple but outputs don't
//    generalize, closer to memorization). Training only on code-execution
//    outputs beats training on all observation types. Dense supervision cuts
//    both ways: forth-lang overfits after ~500 steps, deepdive after just one
//    epoch. Easy-to-memorize outputs help for one epoch but hurt across many.
//    ECHO-trained agents use more total tokens per trajectory but a smaller
//    share are model-generated — they lean on tools more. The same method
//    helps a lot in complex-but-predictable domains and can hurt in
//    memorization-prone ones.
//
// Centerpiece: ONE terminal trajectory strip that starts as a zoomed-in tape
// of commands/outputs/pass-fail badges, then the camera pulls back and that
// same panel morphs (not swaps) into the top lane of a three-lane curve
// comparison — terminal (healthy), forth-lang (overfits at 500 steps),
// deepdive (collapses after one epoch).
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * clamp01(u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);

// ---------------------------------------------------------------------------
// Terminal panel — full-frame bounds (act 1) and lane-1 bounds (act 2). The
// SAME panel morphs between these two rects as the camera pulls back.
// ---------------------------------------------------------------------------
const TERM_FULL = { x: 190, y: 128, w: 900, h: 300 };
const LANE_X = 260;
const LANE_W = 760;
const LANE1 = { x: LANE_X, y: 186, w: LANE_W, h: 108 };
const LANE2 = { x: LANE_X, y: 340, w: LANE_W, h: 108 };
const LANE3 = { x: LANE_X, y: 494, w: LANE_W, h: 108 };

interface TermLine {
  cmd: string;
  out: string;
  pass: boolean;
}
const TERM_LINES: TermLine[] = [
  { cmd: '$ pytest tests/config_loader.py', out: '3 failed, 12 passed', pass: false },
  { cmd: "$ sed -i 's/prot:/proto:/' config.yml", out: 'edited config.yml', pass: true },
  { cmd: '$ ./scripts/build.sh', out: 'build succeeded', pass: true },
  { cmd: '$ curl -sf localhost:8080/health', out: '200 OK', pass: true },
];

const CAM_TERM: CameraState = { x: 640, y: 270, k: 1.28 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 0.98 };

// ---------------------------------------------------------------------------
// Domain curves — pure functions of a "training steps" x-axis, 0..1000.
// Terminal: healthy saturating curve, no collapse.
// forth-lang: rises, then overfits/collapses after x = 500 (steps).
// deepdive: rises fast, then collapses hard after x = 150 (~one epoch).
// ---------------------------------------------------------------------------
const terminalCurve = (x: number): number => 0.9 * (1 - Math.exp(-x / 220));
const forthCurve = (x: number): number => {
  const rise = 0.86 * (1 - Math.exp(-x / 170));
  if (x <= 500) return rise;
  const peak = 0.86 * (1 - Math.exp(-500 / 170));
  return Math.max(0.18, peak - (x - 500) * 0.0013);
};
const deepdiveCurve = (x: number): number => {
  const rise = 0.92 * (1 - Math.exp(-x / 60));
  if (x <= 150) return rise;
  const peak = 0.92 * (1 - Math.exp(-150 / 60));
  return Math.max(0.1, peak - (x - 150) * 0.0032);
};
// "training on every observation type" — a weaker, noisier ceiling than the
// code-execution-only curve it's laid over in lane 2.
const allObsCurve = (x: number): number => 0.55 * (1 - Math.exp(-x / 260));

// ---------------------------------------------------------------------------
// Timeline (~112s)
// ---------------------------------------------------------------------------
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const introU = tl.channel('introU', 0); // terminal panel + frame enter
  const lineU = tl.channel('lineU', 0); // command lines stagger in
  const echoChipU = tl.channel('echoChipU', 0); // ECHO = GRPO+CE chip
  const gaugeU = tl.channel('gaugeU', 0); // pass-rate bars: plain RL vs ECHO
  const stepRaceU = tl.channel('stepRaceU', 0); // ceiling race, linear clock
  const timeoutU = tl.channel('timeoutU', 0); // 19.8% -> 9%
  const generalizeU = tl.channel('generalizeU', 0); // cross-agent chip

  const pullU = tl.channel('pullU', 0); // camera pulls back; panel morphs to lane 1
  const lane1U = tl.channel('lane1U', 0); // terminal curve reveal
  const lane2U = tl.channel('lane2U', 0); // forth-lang curve reveal
  const lane3U = tl.channel('lane3U', 0); // deepdive curve reveal
  const mark2U = tl.channel('mark2U', 0); // 500-step threshold marker
  const mark3U = tl.channel('mark3U', 0); // 1-epoch threshold marker
  const onlyExecU = tl.channel('onlyExecU', 0); // "code-execution only" chip
  const tokensChipU = tl.channel('tokensChipU', 0); // tools-over-tokens chip
  const endU = tl.channel('endU', 0); // closing fade

  // — beat 1 · a terminal agent —
  tl.caption({
    at: 0.5,
    dur: 6.8,
    text: 'Two papers test this masked objective for real. The first watches an agent that works by typing commands into a terminal.',
  });
  tl.tween(cam, CAM_TERM, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(introU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(lineU, 1, { at: 1.8, dur: 3.2, ease: ease.linear });
  tl.hold(6.9, 0.5);

  // — beat 2 · ECHO's recipe on Terminal-Bench —
  tl.caption({
    at: 7.4,
    dur: 7.2,
    text: 'This method is called Echo. Action tokens still get reinforcement learning; every terminal output still gets a supervised loss, on Terminal Bench two point oh.',
  });
  tl.tween(echoChipU, 1, { at: 7.8, dur: 0.7, ease: ease.enter });
  tl.hold(14.2, 0.5);

  // — beat 3 · pass rate roughly doubles —
  tl.caption({
    at: 14.7,
    dur: 5.9,
    text: 'The payoff: Echo roughly doubled the pass rate on those terminal tasks compared with plain reinforcement learning.',
  });
  tl.tween(gaugeU, 1, { at: 15.0, dur: 3.0, ease: ease.enter });
  tl.hold(20.3, 0.4);

  // — beat 4 · learns faster, not just better —
  tl.caption({
    at: 20.7,
    dur: 6.9,
    text: 'It also learns faster, not only better. An eight billion parameter model reached plain group relative policy training’s ceiling in one and a half to two point three times fewer steps.',
  });
  tl.tween(stepRaceU, 1, { at: 21.0, dur: 5.6, ease: ease.linear });
  tl.hold(27.3, 0.4);

  // — beat 5 · timeouts drop —
  tl.caption({
    at: 27.7,
    dur: 6.5,
    text: 'Agents also ran out of time less often. The timeout rate fell from nineteen point eight percent down to nine percent.',
  });
  tl.tween(timeoutU, 1, { at: 28.0, dur: 3.4, ease: ease.move });
  tl.hold(33.9, 0.4);

  // — beat 6 · generalizes across agents —
  tl.caption({
    at: 34.3,
    dur: 6.8,
    text: 'And the benefit is not tied to one agent’s own history. An Echo trained model keeps improving even studying another agent’s terminal trajectories.',
  });
  tl.tween(generalizeU, 1, { at: 34.6, dur: 0.8, ease: ease.enter });
  tl.hold(40.7, 0.5);

  // — beat 7 · pull back: the same method, tested elsewhere —
  tl.caption({
    at: 41.2,
    dur: 7.3,
    text: 'Pull back. A second paper studies that same masked objective across domains that behave very differently from a terminal.',
  });
  tl.tween(cam, CAM_WIDE, { at: 41.4, dur: 2.4, ease: ease.move });
  tl.tween(pullU, 1, { at: 41.4, dur: 2.6, ease: ease.move });
  tl.tween(gaugeU, 0, { at: 41.4, dur: 1.0, ease: ease.move });
  tl.tween(stepRaceU, 0, { at: 41.4, dur: 1.0, ease: ease.move });
  tl.tween(timeoutU, 0, { at: 41.4, dur: 1.0, ease: ease.move });
  tl.tween(generalizeU, 0, { at: 41.4, dur: 1.0, ease: ease.move });
  tl.tween(lane1U, 1, { at: 43.4, dur: 2.4, ease: ease.draw });
  tl.hold(48.1, 0.5);

  // — beat 8 · forth-lang: predictable code —
  tl.caption({
    at: 48.6,
    dur: 7.4,
    text: 'One domain is called forth lang: an unfamiliar, complex scripting language whose outputs are deterministic and learnable.',
  });
  tl.tween(lane2U, 1, { at: 49.0, dur: 2.6, ease: ease.draw });
  tl.hold(55.7, 0.4);

  // — beat 9 · deepdive: memorization risk —
  tl.caption({
    at: 56.1,
    dur: 7.6,
    text: 'The other is deepdive: a retrieval heavy task, mechanically simple, but its outputs don’t generalize, closer to memorizing facts than learning a pattern.',
  });
  tl.tween(lane3U, 1, { at: 56.4, dur: 2.6, ease: ease.draw });
  tl.hold(63.4, 0.4);

  // — beat 10 · only code-execution outputs —
  tl.caption({
    at: 63.8,
    dur: 7.4,
    text: 'Training only on code execution outputs beat training on every kind of observation, because supervising everything risks memorizing instead of learning.',
  });
  tl.tween(onlyExecU, 1, { at: 64.1, dur: 0.8, ease: ease.enter });
  tl.hold(70.9, 0.4);

  // — beat 11 · forth-lang overfits at 500 steps —
  tl.caption({
    at: 71.3,
    dur: 7.2,
    text: 'Dense supervision cuts both ways. In forth lang, training performance collapsed from overfitting after roughly five hundred steps.',
  });
  tl.tween(mark2U, 1, { at: 71.6, dur: 1.2, ease: ease.pop });
  tl.hold(78.2, 0.4);

  // — beat 12 · deepdive collapses even faster —
  tl.caption({
    at: 78.6,
    dur: 7.6,
    text: 'Deepdive collapsed even faster, after just one epoch, because the model was memorizing retrieval outputs instead of learning to retrieve.',
  });
  tl.tween(mark3U, 1, { at: 78.9, dur: 1.2, ease: ease.pop });
  tl.hold(85.9, 0.4);

  // — beat 13 · help once, hurt repeatedly —
  tl.caption({
    at: 86.3,
    dur: 7.2,
    text: 'Outputs that are easy to memorize can help for a single training epoch, but they actively hurt once training runs across several.',
  });
  tl.hold(93.2, 0.4);

  // — beat 14 · trusts the environment more —
  tl.caption({
    at: 93.6,
    dur: 7.8,
    text: 'One more signature: Echo trained agents use more total tokens per trajectory, but a smaller share are model generated. They lean on their tools, and trust the environment more.',
  });
  tl.tween(tokensChipU, 1, { at: 93.9, dur: 0.8, ease: ease.enter });
  tl.hold(101.0, 0.5);

  // — beat 15 · closing lesson —
  tl.caption({
    at: 101.5,
    dur: 8.0,
    text: 'Benefits do not transfer uniformly. The same method helps enormously where the world is complex but predictable, and can hurt where success means memorizing.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 102.0, dur: 2.0, ease: ease.move });
  tl.tween(endU, 1, { at: 103.0, dur: 1.6, ease: ease.move });
  tl.hold(109.6, 1.8);

  return {
    tl,
    cam,
    introU,
    lineU,
    echoChipU,
    gaugeU,
    stepRaceU,
    timeoutU,
    generalizeU,
    pullU,
    lane1U,
    lane2U,
    lane3U,
    mark2U,
    mark3U,
    onlyExecU,
    tokensChipU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Chip({
  x,
  y,
  text,
  color,
  u,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  u: number;
  anchor?: 'middle' | 'start';
}) {
  if (u <= 0.01) return null;
  const w = text.length * 7.2 + 24;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={u}>
      <rect x={x0} y={y - 15} width={w} height={28} rx={8} fill={colors.BG} stroke={color} strokeOpacity={0.7} />
      <text x={x0 + w / 2} y={y + 5} textAnchor="middle" fill={color} fontSize={12} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** lerp a rect between two bounds */
function rectAt(from: typeof TERM_FULL, to: typeof TERM_FULL, u: number) {
  return {
    x: lerp(from.x, to.x, u),
    y: lerp(from.y, to.y, u),
    w: lerp(from.w, to.w, u),
    h: lerp(from.h, to.h, u),
  };
}

function LanePlot({
  bounds,
  reveal,
  f,
  color,
  label,
  markX,
  markLabel,
  markU,
}: {
  bounds: { x: number; y: number; w: number; h: number };
  reveal: number;
  f: (x: number) => number;
  color: string;
  label: string;
  markX?: number;
  markLabel?: string;
  markU?: number;
}) {
  if (reveal <= 0.01) return null;
  const xs = scaleLinear().domain([0, 1000]).range([bounds.x, bounds.x + bounds.w]);
  const ys = scaleLinear().domain([0, 1]).range([bounds.y + bounds.h, bounds.y]);
  return (
    <g opacity={reveal}>
      <rect x={bounds.x - 14} y={bounds.y - 14} width={bounds.w + 28} height={bounds.h + 30} rx={12} fill={colors.PANEL} opacity={0.55} />
      <Axes x={xs} y={ys} reveal={reveal} xTicks={4} yTicks={2} fontSize={10} color={colors.MUTED} />
      <FunctionPlot x={xs} y={ys} f={f} domain={[0, 1000]} reveal={reveal} color={color} width={3} />
      <text x={bounds.x - 4} y={bounds.y - 20} fill={color} fontSize={13} fontWeight={600}>
        {label}
      </text>
      {markX !== undefined && markU !== undefined && markU > 0.01 && (
        <g opacity={markU}>
          <line
            x1={xs(markX)}
            y1={ys(0)}
            x2={xs(markX)}
            y2={ys(1)}
            stroke={colors.NEGATIVE}
            strokeWidth={1.6}
            strokeDasharray="5 5"
          />
          <text x={xs(markX)} y={ys(1) - 8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
            {markLabel}
          </text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const introU = s.get(scene.introU);
  const lineU = s.get(scene.lineU);
  const echoChipU = s.get(scene.echoChipU);
  const gaugeU = s.get(scene.gaugeU);
  const stepRaceU = s.get(scene.stepRaceU);
  const timeoutU = s.get(scene.timeoutU);
  const generalizeU = s.get(scene.generalizeU);
  const pullU = s.get(scene.pullU);
  const lane1U = s.get(scene.lane1U);
  const lane2U = s.get(scene.lane2U);
  const lane3U = s.get(scene.lane3U);
  const mark2U = s.get(scene.mark2U);
  const mark3U = s.get(scene.mark3U);
  const onlyExecU = s.get(scene.onlyExecU);
  const tokensChipU = s.get(scene.tokensChipU);
  const endU = s.get(scene.endU);

  const dim = 1 - 0.85 * endU;
  const panel = rectAt(TERM_FULL, LANE1, pullU);
  const termOpacity = introU * (1 - pullU);
  const passRate0 = 42; // baseline pass-rate bar height, arbitrary units
  const passRate1 = lerp(passRate0, passRate0 * 2, gaugeU);
  const timeoutPct = lerp(19.8, 9, timeoutU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dim}>
          {/* ---------------- the persistent panel: terminal → lane 1 ---------------- */}
          {introU > 0.01 && (
            <g opacity={introU}>
              <rect
                x={panel.x}
                y={panel.y}
                width={panel.w}
                height={panel.h}
                rx={14}
                fill={colors.PANEL}
                stroke={colors.ACCENT}
                strokeOpacity={0.55}
              />
              {/* terminal content — fades as the panel morphs into lane 1 */}
              {termOpacity > 0.01 && (
                <g opacity={termOpacity}>
                  <circle cx={panel.x + 22} cy={panel.y + 22} r={5} fill={colors.NEGATIVE} opacity={0.7} />
                  <circle cx={panel.x + 40} cy={panel.y + 22} r={5} fill={colors.WARM} opacity={0.7} />
                  <circle cx={panel.x + 58} cy={panel.y + 22} r={5} fill={colors.POSITIVE} opacity={0.7} />
                  <text x={panel.x + 84} y={panel.y + 27} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    agent terminal — Terminal-Bench 2.0
                  </text>
                  {TERM_LINES.map((ln, i) => {
                    const u = win(lineU, TERM_LINES.length, i, 1.3);
                    if (u <= 0) return null;
                    const rowY = panel.y + 58 + i * 56;
                    return (
                      <g key={i} opacity={u} transform={`translate(0 ${8 * (1 - u)})`}>
                        <text x={panel.x + 22} y={rowY} fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                          {ln.cmd}
                        </text>
                        <text x={panel.x + 22} y={rowY + 20} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                          {ln.out}
                        </text>
                        <circle cx={panel.x + panel.w - 26} cy={rowY - 5} r={7} fill={ln.pass ? colors.POSITIVE : colors.NEGATIVE} />
                        <text
                          x={panel.x + panel.w - 26}
                          y={rowY - 1}
                          textAnchor="middle"
                          fill={colors.BG}
                          fontSize={9}
                          fontWeight={700}
                        >
                          {ln.pass ? '✓' : '✗'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          )}

          <Chip x={950} y={98} text="ECHO: GRPO on actions + cross-entropy on outputs" color={colors.SECONDARY} u={echoChipU * termOpacity} anchor="start" />

          {/* ---------------- pass-rate bars: plain RL vs ECHO ---------------- */}
          {gaugeU > 0.01 && (
            <g opacity={gaugeU * termOpacity} transform="translate(1010 0)">
              <text x={0} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                pass rate
              </text>
              <rect x={-46} y={380 - passRate0} width={38} height={passRate0} rx={4} fill={colors.MUTED} opacity={0.5} />
              <text x={-27} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
                plain RL
              </text>
              <rect x={8} y={380 - passRate1} width={38} height={passRate1} rx={4} fill={colors.POSITIVE} />
              <text x={27} y={396} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>
                ECHO
              </text>
              <text x={27} y={380 - passRate1 - 10} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontWeight={700}>
                {gaugeU > 0.5 ? '~2x' : ''}
              </text>
            </g>
          )}

          {/* ---------------- step-to-ceiling race ---------------- */}
          {stepRaceU > 0.01 && (
            <g opacity={stepRaceU * termOpacity}>
              <text x={panel.x} y={460} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                steps to plain-GRPO&apos;s ceiling
              </text>
              <rect x={panel.x} y={472} width={panel.w} height={12} rx={6} fill={colors.GRID} />
              <rect x={panel.x} y={472} width={panel.w * Math.min(1, stepRaceU)} height={12} rx={6} fill={colors.MUTED} opacity={0.55} />
              <rect x={panel.x} y={492} width={panel.w} height={12} rx={6} fill={colors.GRID} />
              <rect
                x={panel.x}
                y={492}
                width={panel.w * Math.min(1, stepRaceU * 1.9)}
                height={12}
                rx={6}
                fill={colors.POSITIVE}
              />
              <text x={panel.x + panel.w + 10} y={481} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                plain GRPO
              </text>
              <text x={panel.x + panel.w + 10} y={501} fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>
                ECHO — 1.5–2.3x fewer steps
              </text>
            </g>
          )}

          {/* ---------------- timeout percentage ---------------- */}
          {timeoutU > 0.01 && (
            <g opacity={timeoutU * termOpacity}>
              <text x={panel.x} y={548} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                timeout rate
              </text>
              <text x={panel.x + 150} y={552} fill={colors.WARM} fontSize={22} fontWeight={700} fontFamily={MONO}>
                {timeoutPct.toFixed(1)}%
              </text>
            </g>
          )}

          <Chip
            x={640}
            y={68}
            text="generalizes: trains on another agent's trajectories too"
            color={colors.ACCENT}
            u={generalizeU * termOpacity}
          />

          {/* ---------------- the three-lane comparison ---------------- */}
          <LanePlot bounds={LANE1} reveal={lane1U * pullU} f={terminalCurve} color={colors.POSITIVE} label="terminal — Terminal-Bench 2.0" />
          <LanePlot
            bounds={LANE2}
            reveal={lane2U * pullU}
            f={forthCurve}
            color={colors.ACCENT}
            label="forth-lang — predictable code"
            markX={500}
            markLabel="500 steps: overfit"
            markU={mark2U}
          />
          <LanePlot
            bounds={LANE3}
            reveal={lane3U * pullU}
            f={deepdiveCurve}
            color={colors.NEGATIVE}
            label="deepdive — retrieval, memorization risk"
            markX={150}
            markLabel="1 epoch: memorized"
            markU={mark3U}
          />
          {/* ghost curve: "all observations" underperforming baseline, in lane 2 */}
          {onlyExecU > 0.01 && (
            <g opacity={onlyExecU * pullU * 0.8}>
              <FunctionPlot
                x={scaleLinear().domain([0, 1000]).range([LANE2.x, LANE2.x + LANE2.w])}
                y={scaleLinear().domain([0, 1]).range([LANE2.y + LANE2.h, LANE2.y])}
                f={allObsCurve}
                domain={[0, 1000]}
                reveal={onlyExecU}
                dash
                color={colors.MUTED}
                width={2}
              />
              <text x={LANE2.x + LANE2.w - 4} y={LANE2.y - 20} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                training on every observation type — worse
              </text>
            </g>
          )}

          <Chip
            x={640}
            y={618}
            text="more tokens per trajectory, smaller share model-generated"
            color={colors.SECONDARY}
            u={tokensChipU * pullU}
          />
        </g>

        {/* ---------------- closing backdrop ---------------- */}
        {endU > 0.01 && (
          <g opacity={endU}>
            <rect x={140} y={260} width={1000} height={170} rx={18} fill={colors.BG} stroke={colors.GRID} />
            <text x={640} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={600}>
              complex but predictable: helps a lot
            </text>
            <text x={640} y={368} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} fontWeight={600}>
              memorization-prone: can hurt
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
