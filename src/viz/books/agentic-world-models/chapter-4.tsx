// PaW — three knobs on one co-training recipe
//
// Grounding: the Substack essay "Agentic World Models" by Cameron R. Wolfe
// (July 2026), covering the paper "PaW" (Policy and World-modeling
// co-training). Chapters 1-3 of this book established: sparse rewards are
// the core problem; the fix is a token-level mask routing action tokens to
// the RL loss and observation tokens to a supervised world-modeling loss;
// and that dense supervision helps a lot empirically (ECHO, "True Agents
// Model the World") but carries an overfitting/memorization risk. PaW
// answers that tension with three concrete interventions, all real, none
// invented:
//   1. Action-entropy selection — only the top alpha=0.75 highest-entropy
//      (most uncertain) actions have their resulting observation used for
//      the world-modeling loss. The RL/policy loss still covers every
//      action; only the dense observation-prediction loss is filtered.
//   2. Clipped mean-absolute-error loss (instead of plain cross-entropy)
//      for observation prediction, with a confidence threshold rho=0.2 —
//      it stops over-optimizing tokens already predicted well, taming
//      memorization and rare-token gradient blow-ups.
//   3. Dynamic lambda_wm — a per-rollout-group weight on the world-modeling
//      loss inside GRPO-style group training: high-reward groups turn it
//      down (trust the reward signal); low/zero-reward groups turn it up
//      (lean on the world model when reward alone teaches little).
// PaW generalizes across RL algorithms (GRPO, GIGPO) and model families,
// with the largest benefit in sparse-reward regimes — the exact setting
// chapter 1 opened with.
//
// Centerpiece: ONE control panel, three stations sharing it — an entropy
// filter sweeping a row of action tokens, a FunctionPlot morphing a spiky
// cross-entropy curve into a bounded clipped curve, and a literal reward/
// world-model dial swinging per rollout group. Camera pushes into each
// station in turn, then pulls back to show all three as one recipe.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * clamp01(u);

// ---------------------------------------------------------------------------
// Panel + layout
// ---------------------------------------------------------------------------

const PANEL = { x: 90, y: 150, w: 1100, h: 460 };

// — station A: action-entropy selection —
const N_TOK = 12;
const TOK_X0 = 210;
const TOK_DX = 68;
const TOK_BASE_Y = 300;
const TOK_W = 36;

const rng = mulberry32(20260717);
const ENTROPY = Array.from({ length: N_TOK }, () => rng());
const SORTED_DESC = [...ENTROPY].sort((a, b) => b - a);
const KEEP_N = Math.round(N_TOK * 0.75); // alpha = 0.75
const THRESH = SORTED_DESC[KEEP_N - 1];

// — station B: clipped loss curve —
const RHO = 0.2;
const LOSS_X = scaleLinear().domain([0.05, 1]).range([170, 560]);
const LOSS_Y = scaleLinear().domain([0, 3.2]).range([560, 340]);
const CE = (p: number): number => -Math.log(Math.max(p, 0.02));
const CLIPPED = (p: number): number => Math.min(1 - p, 1);

// — station C: the dial —
const DIAL = { x: 940, y: 440, r: 110 };
const ANGLE_WM = 150; // degrees, needle pointing toward "trust world model"
const ANGLE_MID = 90;
const ANGLE_RW = 30; // degrees, needle pointing toward "trust the reward"
function needlePoint(deg: number, r: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: DIAL.x - r * Math.cos(rad), y: DIAL.y - r * Math.sin(rad) };
}
function arcPath(r: number, a0: number, a1: number): string {
  const p0 = needlePoint(a0, r);
  const p1 = needlePoint(a1, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A${r} ${r} 0 ${large} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
}

// camera marks
const CAM_ENTROPY: CameraState = { x: 500, y: 300, k: 1.55 };
const CAM_LOSS: CameraState = { x: 420, y: 450, k: 1.55 };
const CAM_DIAL: CameraState = { x: 950, y: 430, k: 1.5 };

// ---------------------------------------------------------------------------
// Timeline (~104s)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const panelU = tl.channel('panelU', 0); // panel + title draw-on
  const entropyU = tl.channel('entropyU', 0); // token bars stamp in, staggered
  const threshU = tl.channel('threshU', 0); // threshold sweep line
  const keepU = tl.channel('keepU', 0); // dim the dropped bottom 25%
  const policyNoteU = tl.channel('policyNoteU', 0); // "policy loss: every action" chip

  const axesU = tl.channel('axesU', 0);
  const ceU = tl.channel('ceU', 0); // cross-entropy curve reveal
  const morphU = tl.channel('morphU', 0); // CE -> clipped MAE
  const rhoLineU = tl.channel('rhoLineU', 0); // rho threshold marker

  const dialU = tl.channel('dialU', 0); // gauge arc reveal
  const needleDeg = tl.channel('needleDeg', ANGLE_MID); // needle angle
  const groupAU = tl.channel('groupAU', 0); // "group A: high reward" label
  const groupBU = tl.channel('groupBU', 0); // "group B: low reward" label

  const genU = tl.channel('genU', 0); // generalization strip (GRPO/GIGPO)
  const endU = tl.channel('endU', 0); // closing card

  // — beat 1 · the tension, and the three-knob recipe —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'This paper, called Paw, tackles that overfitting risk directly, with three interventions bolted onto the same policy and world modeling co-training loop.',
  });
  tl.tween(panelU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.hold(7.4, 0.6);

  // — beat 2 · entropy scoring —
  tl.caption({
    at: 8.0,
    dur: 6.6,
    text: "Not every action gets used to teach the world model. Each transition is scored by how uncertain the policy was about that action.",
  });
  tl.tween(cam, CAM_ENTROPY, { at: 8.2, dur: 1.5, ease: ease.move });
  tl.tween(entropyU, 1, { at: 8.8, dur: 3.2, ease: ease.linear });
  tl.hold(14.8, 0.6);

  // — beat 3 · the 75% filter —
  tl.caption({
    at: 15.4,
    dur: 7.0,
    text: 'Only the top seventy-five percent most uncertain actions have their resulting observation folded into the world-modeling loss.',
  });
  tl.tween(threshU, 1, { at: 15.8, dur: 1.8, ease: ease.draw });
  tl.tween(keepU, 1, { at: 17.4, dur: 1.6, ease: ease.move });
  tl.hold(22.6, 0.6);

  // — beat 4 · the policy loss is untouched —
  tl.caption({
    at: 23.2,
    dur: 6.4,
    text: "The policy loss still learns from every action taken. It's only the dense observation-prediction signal that gets this filter.",
  });
  tl.tween(policyNoteU, 1, { at: 23.6, dur: 0.7, ease: ease.enter });
  tl.hold(29.8, 0.6);

  // — beat 5 · why: spend supervision where it matters —
  tl.caption({
    at: 30.4,
    dur: 7.4,
    text: "The idea: don't spend supervision teaching the model to predict observations it already predicts confidently. Spend it where the world model still guesses.",
  });
  tl.tween(policyNoteU, 0, { at: 34.6, dur: 0.6, ease: ease.enter });
  tl.hold(38.0, 0.6);

  // — beat 6 · station B: the clipped loss shape —
  tl.caption({
    at: 38.6,
    dur: 6.8,
    text: 'The second intervention changes the shape of that supervision itself, swapping plain cross-entropy for a clipped loss.',
  });
  tl.tween(cam, CAM_LOSS, { at: 38.8, dur: 1.6, ease: ease.move });
  tl.tween(axesU, 1, { at: 39.6, dur: 1.0, ease: ease.draw });
  tl.tween(ceU, 1, { at: 40.4, dur: 2.0, ease: ease.draw });
  tl.hold(45.6, 0.6);

  // — beat 7 · the morph past the confidence threshold —
  tl.caption({
    at: 46.2,
    dur: 7.2,
    text: 'Once a predicted token crosses a confidence threshold of point two, the loss stops pushing harder on it.',
  });
  tl.tween(rhoLineU, 1, { at: 46.6, dur: 0.8, ease: ease.enter });
  tl.tween(morphU, 1, { at: 47.6, dur: 2.6, ease: ease.move });
  tl.hold(53.6, 0.6);

  // — beat 8 · two failure modes tamed —
  tl.caption({
    at: 54.2,
    dur: 7.6,
    text: 'That clip tames two failure modes at once: memorizing observations verbatim, and gradient blow-ups when a rare token happens to be wrong.',
  });
  tl.hold(62.0, 0.6);

  // — beat 9 · station C: the dial, introduced —
  tl.caption({
    at: 62.6,
    dur: 5.8,
    text: 'The third intervention is a dial, not a filter — one that turns per group of rollouts.',
  });
  tl.tween(cam, CAM_DIAL, { at: 62.8, dur: 1.6, ease: ease.move });
  tl.tween(dialU, 1, { at: 63.6, dur: 1.4, ease: ease.draw });
  tl.hold(68.6, 0.5);

  // — beat 10 · high-reward group: trust the reward —
  tl.caption({
    at: 69.2,
    dur: 7.4,
    text: 'Recall that group relative policy training trains on groups of rollouts sharing one prompt. A group that already scored high reward turns its world modeling weight down.',
  });
  tl.tween(groupAU, 1, { at: 69.6, dur: 0.6, ease: ease.enter });
  tl.tween(needleDeg, ANGLE_RW, { at: 70.4, dur: 1.8, ease: ease.move });
  tl.hold(76.8, 0.5);

  // — beat 11 · low-reward group: lean on the world model —
  tl.caption({
    at: 77.4,
    dur: 8.0,
    text: 'A group that scored low or zero reward has little reward signal to climb, so its world-modeling weight turns up — lean on the environment instead.',
  });
  tl.tween(groupAU, 0, { at: 77.6, dur: 0.5, ease: ease.enter });
  tl.tween(groupBU, 1, { at: 78.2, dur: 0.6, ease: ease.enter });
  tl.tween(needleDeg, ANGLE_WM, { at: 79.0, dur: 1.8, ease: ease.move });
  tl.hold(85.6, 0.5);

  // — beat 12 · generalization —
  tl.caption({
    at: 86.2,
    dur: 6.6,
    text: "This recipe isn't tied to one algorithm. It holds up across group relative policy training and its group and individual variant, and across different model families.",
  });
  tl.tween(groupBU, 0, { at: 86.4, dur: 0.5, ease: ease.enter });
  tl.tween(needleDeg, ANGLE_MID, { at: 86.6, dur: 1.2, ease: ease.move });
  tl.tween(genU, 1, { at: 87.4, dur: 0.9, ease: ease.enter });
  tl.hold(93.0, 0.5);

  // — beat 13 · strongest where it matters most —
  tl.caption({
    at: 93.6,
    dur: 6.8,
    text: 'And its payoff is largest exactly where this book started: sparse-reward regimes, where the policy has the least reward signal to learn from.',
  });
  tl.hold(100.6, 0.5);

  // — beat 14 · closing: pull back, name the recipe —
  tl.caption({
    at: 101.2,
    dur: 8.0,
    text: 'Filter the uncertain actions, clip the loss that trains on them, and dial the balance per group — three knobs on one co-training recipe.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 101.4, dur: 1.8, ease: ease.move });
  tl.tween(genU, 0, { at: 101.4, dur: 0.6, ease: ease.enter });
  tl.tween(endU, 1, { at: 102.6, dur: 1.4, ease: ease.move });
  tl.hold(109.6, 1.4);

  return {
    tl,
    cam,
    panelU,
    entropyU,
    threshU,
    keepU,
    policyNoteU,
    axesU,
    ceU,
    morphU,
    rhoLineU,
    dialU,
    needleDeg,
    groupAU,
    groupBU,
    genU,
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

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const panelU = s.get(scene.panelU);
  const entropyU = s.get(scene.entropyU);
  const threshU = s.get(scene.threshU);
  const keepU = s.get(scene.keepU);
  const policyNoteU = s.get(scene.policyNoteU);
  const axesU = s.get(scene.axesU);
  const ceU = s.get(scene.ceU);
  const morphU = s.get(scene.morphU);
  const rhoLineU = s.get(scene.rhoLineU);
  const dialU = s.get(scene.dialU);
  const needleDeg = s.get(scene.needleDeg);
  const groupAU = s.get(scene.groupAU);
  const groupBU = s.get(scene.groupBU);
  const genU = s.get(scene.genU);
  const endU = s.get(scene.endU);

  const fade = 1 - 0.9 * endU;
  const threshY = TOK_BASE_Y - THRESH * 92 - 6;
  const needlePt = needlePoint(needleDeg, DIAL.r - 14);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---------------- the control panel frame ---------------- */}
        <g opacity={panelU * fade}>
          <rect
            x={PANEL.x}
            y={PANEL.y}
            width={PANEL.w}
            height={PANEL.h}
            rx={18}
            fill={colors.PANEL}
            stroke={colors.GRID}
            strokeWidth={1.6}
          />
          <text x={PANEL.x + 24} y={PANEL.y + 34} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
            PaW — policy and world-modeling co-training
          </text>
        </g>

        {/* ---------------- station A: action-entropy selection ---------------- */}
        <g opacity={fade}>
          <text x={TOK_X0} y={TOK_BASE_Y - 118} fill={colors.MUTED} fontSize={13} opacity={entropyU}>
            action-token entropy
          </text>
          {ENTROPY.map((e, i) => {
            const u = win(entropyU, N_TOK, i, 1.6);
            if (u <= 0) return null;
            const x = TOK_X0 + i * TOK_DX;
            const h = e * 92 * u;
            const kept = e >= THRESH;
            const dim = kept ? 1 : lerp(1, 0.22, keepU);
            const color = kept ? colors.ACCENT : colors.MUTED;
            return (
              <g key={i} opacity={u}>
                <rect
                  x={x - TOK_W / 2}
                  y={TOK_BASE_Y - h}
                  width={TOK_W}
                  height={h}
                  rx={5}
                  fill={color}
                  opacity={0.75 * dim}
                />
                <rect
                  x={x - TOK_W / 2}
                  y={TOK_BASE_Y}
                  width={TOK_W}
                  height={22}
                  rx={5}
                  fill={colors.BG}
                  stroke={color}
                  strokeOpacity={0.6 * dim}
                />
                <text x={x} y={TOK_BASE_Y + 16} textAnchor="middle" fill={color} fontSize={10.5} fontFamily={MONO} opacity={dim}>
                  a{i + 1}
                </text>
                {keepU > 0.4 && !kept && (
                  <line
                    x1={x - TOK_W / 2 + 3}
                    y1={TOK_BASE_Y - h - 3}
                    x2={x + TOK_W / 2 - 3}
                    y2={TOK_BASE_Y + 3}
                    stroke={colors.NEGATIVE}
                    strokeWidth={1.4}
                    opacity={0.5 * clamp01((keepU - 0.4) / 0.4)}
                  />
                )}
              </g>
            );
          })}
          {/* threshold sweep line */}
          {threshU > 0.01 && (
            <g opacity={threshU}>
              <line
                x1={TOK_X0 - 40}
                y1={threshY}
                x2={TOK_X0 - 40 + (TOK_X0 + (N_TOK - 1) * TOK_DX + 40 - (TOK_X0 - 40)) * threshU}
                y2={threshY}
                stroke={colors.WARM}
                strokeWidth={2}
                strokeDasharray="6 5"
              />
              <text x={TOK_X0 - 40} y={threshY - 10} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                keep top 75% (α = 0.75)
              </text>
            </g>
          )}
          <Chip
            x={PANEL.x + PANEL.w / 2}
            y={TOK_BASE_Y + 66}
            text="policy loss: trains on every action, unfiltered"
            color={colors.SECONDARY}
            u={policyNoteU}
          />
        </g>

        {/* ---------------- station B: the clipped loss curve ---------------- */}
        <g opacity={fade}>
          <Axes x={LOSS_X} y={LOSS_Y} reveal={axesU} xLabel="predicted probability" yLabel="observation-prediction loss" xTicks={5} yTicks={4} />
          <FunctionPlot
            x={LOSS_X}
            y={LOSS_Y}
            f={CLIPPED}
            morph={{ from: CE, u: morphU }}
            reveal={ceU}
            color={colors.ACCENT}
            width={3}
          />
          {rhoLineU > 0.01 && (
            <g opacity={rhoLineU}>
              <line
                x1={LOSS_X(0.8)}
                y1={LOSS_Y.range()[0]}
                x2={LOSS_X(0.8)}
                y2={LOSS_Y.range()[1]}
                stroke={colors.WARM}
                strokeWidth={1.6}
                strokeDasharray="5 5"
              />
              <MathLabel tex={'\\rho = 0.2'} x={LOSS_X(0.8) + 14} y={LOSS_Y(2.5)} fontSize={18} color={colors.WARM} anchor="start" />
            </g>
          )}
          <text x={LOSS_X(0.32)} y={LOSS_Y(1.7)} fill={colors.MUTED} fontSize={11} opacity={ceU * (1 - morphU)} fontStyle="italic">
            cross-entropy: unbounded near p → 0
          </text>
          <text x={LOSS_X(0.32)} y={LOSS_Y(1.7)} fill={colors.MUTED} fontSize={11} opacity={morphU} fontStyle="italic">
            clipped MAE: bounded, no blow-up
          </text>
        </g>

        {/* ---------------- station C: the reward / world-model dial ---------------- */}
        <g opacity={dialU * fade}>
          <path d={arcPath(DIAL.r, ANGLE_WM + 20, ANGLE_RW - 20)} fill="none" stroke={colors.GRID} strokeWidth={10} strokeLinecap="round" />
          <path
            d={arcPath(DIAL.r, ANGLE_MID, ANGLE_RW - 20)}
            fill="none"
            stroke={colors.POSITIVE}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.5}
          />
          <path
            d={arcPath(DIAL.r, ANGLE_WM + 20, ANGLE_MID)}
            fill="none"
            stroke={colors.SECONDARY}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.5}
          />
          <text x={needlePoint(ANGLE_RW, DIAL.r + 32).x} y={needlePoint(ANGLE_RW, DIAL.r + 32).y} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
            trust the reward
          </text>
          <text x={needlePoint(ANGLE_WM, DIAL.r + 32).x} y={needlePoint(ANGLE_WM, DIAL.r + 32).y} textAnchor="middle" fill={colors.SECONDARY} fontSize={13}>
            trust the world model
          </text>
          <circle cx={DIAL.x} cy={DIAL.y} r={7} fill={colors.TEXT} />
          <line x1={DIAL.x} y1={DIAL.y} x2={needlePt.x} y2={needlePt.y} stroke={colors.WARM} strokeWidth={3.5} strokeLinecap="round" />
          <text x={DIAL.x} y={DIAL.y + 46} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            λ per rollout group
          </text>
          <Chip x={DIAL.x} y={DIAL.y - 150} text="group A: high reward → λ_wm down" color={colors.POSITIVE} u={groupAU} />
          <Chip x={DIAL.x} y={DIAL.y - 150} text="group B: low/zero reward → λ_wm up" color={colors.SECONDARY} u={groupBU} />
        </g>

        {/* ---------------- generalization strip ---------------- */}
        {genU > 0.01 && (
          <g opacity={genU * fade}>
            <rect x={PANEL.x + 24} y={PANEL.y + PANEL.h - 56} width={520} height={36} rx={8} fill={colors.BG} stroke={colors.GRID} />
            <text x={PANEL.x + 44} y={PANEL.y + PANEL.h - 32} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              GRPO · GIGPO · multiple model families · strongest under sparse reward
            </text>
          </g>
        )}
      </Camera>

      {/* ---------------- closing card ---------------- */}
      {endU > 0.01 && (
        <g opacity={endU}>
          <rect x={0} y={0} width={STAGE_W} height={STAGE_H} fill={colors.BG} opacity={0.86 * endU} />
          <text x={STAGE_W / 2} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={600}>
            select · clip · dial
          </text>
          <text x={STAGE_W / 2} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            three knobs on one co-training recipe
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
