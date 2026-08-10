// Chapter 2 — Five Forces, One Balance.
//
// Grounded in Section 5 (the force-balance model, subsections 5.1–5.5) and
// Section 5.6 (coupling effects). The five force PAIRS are drawn as five
// tug-of-war gauges with the paper's own names on each side; pressure drags
// every marker toward maintenance. Section 5.6's loop — incentive distortion
// → dissent cost → authority substitution → signal degradation → evaluation
// drift → back into incentives — is animated as a ring, and then the paper's
// REAL Figure 1 (figures/fig1-coupling.png, cropped from page 7 of the PDF)
// is placed beside it: our ring is the dynamics, the paper's figure is the
// resulting flow from forces to theater.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Figure } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// The paper's five force pairs, verbatim from 5.1–5.5, with each pair's
// characteristic failure mode as the sub-label.
const PAIRS = [
  { left: 'authority load', right: 'resistance capacity', failure: 'delegation without authority' },
  { left: 'incentive alignment', right: 'truth pressure', failure: 'performative alignment' },
  { left: 'individual risk', right: 'collective correction', failure: 'preference falsification · liability laundering' },
  { left: 'signal integrity', right: 'epistemic noise', failure: 'noise routed as signal' },
  { left: 'evaluation stability', right: 'post hoc drift', failure: 'evaluation backpropagation' },
] as const;

// Healthy marker position (0 = full maintenance / left, 1 = full correction /
// right) and where pressure drags each pair.
const HEALTHY = [0.72, 0.68, 0.74, 0.7, 0.66];
const TIPPED = [0.22, 0.16, 0.12, 0.2, 0.15];

// Section 5.6's coupling loop, in the paper's own causal order.
const LOOP = [
  'incentive distortion',
  'cost of dissent rises',
  'authority substitution',
  'signal discrimination degrades',
  'evaluation distorts',
] as const;
const LOOP_CX = 320;
const LOOP_CY = 368;
const LOOP_R = 158;
const loopPos = (i: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / LOOP.length;
  return { x: LOOP_CX + LOOP_R * Math.cos(a), y: LOOP_CY + LOOP_R * Math.sin(a) };
};

const GAUGE_X = 560;
const GAUGE_W = 570;
const gaugeY = (i: number) => 150 + i * 92;

const CAM_GAUGES: CameraState = { x: 845, y: 350, k: 1.16 };
const CAM_LOOP: CameraState = { x: 430, y: 360, k: 1.22 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  gaugesU: ChannelRef<number>;
  focusRow: ChannelRef<number>;
  focusU: ChannelRef<number>;
  pressureU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  spinU: ChannelRef<number>;
  figU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gaugesU = tl.channel('gaugesU', 0);
  const focusRow = tl.channel('focusRow', -1);
  const focusU = tl.channel('focusU', 0);
  const pressureU = tl.channel('pressureU', 0);
  const loopU = tl.channel('loopU', 0);
  const spinU = tl.channel('spinU', 0);
  const figU = tl.channel('figU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  const focus = (row: number, at: number) => {
    tl.tween(focusU, 0, { at, dur: 0.4, ease: ease.move });
    tl.tween(focusRow, row, { at: at + 0.4, dur: 0.3, ease: ease.move });
    tl.tween(focusU, 1, { at: at + 0.7, dur: 0.5, ease: ease.enter });
  };

  // Beat 0 — the balance, stated.
  tl.caption({
    at: 0.1,
    dur: 6.6,
    text: 'A system needs enough coherence to act, and enough correction to keep that coherence answerable to reality. The paper models the tension as five opposing force pairs — and the regime begins when all five tip the same way.',
  });
  tl.tween(gaugesU, 1, { at: 0.2, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_GAUGES, { at: 0.4, dur: 1.4, ease: ease.move });
  tl.hold(7.1, 0.6);

  // Beat 1 — authority load vs resistance capacity.
  tl.caption({
    at: 7.7,
    dur: 6.8,
    text: 'Pair one: authority load against resistance capacity. Authority is not the problem — mandates without a matching right to refuse are. An analyst tasked with producing an answer, but structurally denied the right to reject a flawed premise, can only stabilize the frame.',
  });
  focus(0, 7.8);
  tl.hold(14.7, 0.6);

  // Beat 2 — incentives vs truth pressure.
  tl.caption({
    at: 15.3,
    dur: 6.6,
    text: 'Pair two: incentives against truth pressure. Systems rarely optimize truth directly; they optimize what evaluators can score — responsiveness, fluency, confidence. Under pressure those proxies detach, and producing output that merely looks adequate becomes the rational move.',
  });
  focus(1, 15.4);
  tl.hold(22.1, 0.6);

  // Beat 3 — individual risk vs collective correction.
  tl.caption({
    at: 22.7,
    dur: 6.8,
    text: 'Pair three: individual risk against collective correction. The person who slows a workflow to verify pays the cost now, alone; the benefit of being right is diffuse and late. Privately recognized problems stay publicly unchallenged — agreement persists while belief diverges.',
  });
  focus(2, 22.8);
  tl.hold(29.7, 0.6);

  // Beat 4 — signal integrity vs epistemic noise.
  tl.caption({
    at: 30.3,
    dur: 7.3,
    text: 'Pair four: signal integrity against epistemic noise. Correction needs a stable line between data, instruction, commentary, and generated inference. Blur those boundaries and the system starts routing noise as though it were signal.',
  });
  focus(3, 30.4);
  tl.hold(37.1, 0.6);

  // Beat 5 — evaluation stability vs post hoc drift.
  tl.caption({
    at: 37.7,
    dur: 6.6,
    text: 'Pair five: evaluation stability against drift. When criteria shift after outcomes are visible, downstream scoring starts reshaping upstream behavior. The metric stops observing the system and begins training it.',
  });
  focus(4, 37.8);
  tl.hold(44.5, 0.6);

  // Beat 6 — pressure tips all five.
  tl.caption({
    at: 45.1,
    dur: 6.4,
    text: 'Now apply sustained local pressure. Every marker slides the same direction — toward maintaining the legible story and away from correcting it. No single gauge failing explains the regime. The synchronized slide does.',
  });
  tl.tween(focusU, 0, { at: 45.2, dur: 0.5, ease: ease.move });
  tl.tween(pressureU, 1, { at: 45.7, dur: 3.4, ease: ease.move });
  tl.hold(51.7, 0.6);

  // Beat 7 — the coupling loop.
  tl.caption({
    at: 52.3,
    dur: 7.0,
    text: 'Because the pairs are coupled. Incentive distortion raises the cost of dissent. Less dissent means more unchecked authority. Substituted authority degrades signal discrimination. Degraded signals distort evaluation — which feeds back into incentives. Around it goes.',
  });
  tl.tween(cam, CAM_LOOP, { at: 52.5, dur: 1.5, ease: ease.move });
  tl.tween(loopU, 1, { at: 53.0, dur: 1.8, ease: ease.draw });
  tl.tween(spinU, 1, { at: 54.6, dur: 4.2, ease: ease.linear });
  tl.hold(59.5, 0.6);

  // Beat 8 — the paper's own Figure 1.
  tl.caption({
    at: 60.1,
    dur: 6.8,
    text: 'The paper compresses this into its first figure: three loads at the top, coherence maintenance chosen over correction in the middle, and the flow bottoming out in coherence theater — with correction priced out at the threshold. This is that figure, taken straight from the paper itself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 60.3, dur: 1.5, ease: ease.move });
  tl.tween(figU, 1, { at: 60.9, dur: 1.4, ease: ease.enter });
  tl.hold(67.1, 0.6);

  // Beat 9 — close.
  tl.caption({
    at: 67.7,
    dur: 6.2,
    text: 'Coupling is what turns a list of distortions into a propagating regime. Which raises the next question: propagating along what? The next chapter follows one artifact down the paper’s own worked scenario.',
  });
  tl.tween(dimU, 1, { at: 68.0, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 69.1, dur: 0.9, ease: ease.enter });
  tl.hold(74.1, 1.2);

  return { tl, cam, gaugesU, focusRow, focusU, pressureU, loopU, spinU, figU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Gauge({
  i,
  reveal,
  active,
  pressure,
}: {
  i: number;
  reveal: number;
  active: boolean;
  pressure: number;
}) {
  const y = gaugeY(i);
  const pos = lerp(HEALTHY[i], TIPPED[i], pressure);
  const mx = GAUGE_X + pos * GAUGE_W;
  const tipped = pos < 0.45;
  const color = tipped ? colors.NEGATIVE : colors.POSITIVE;
  const p = PAIRS[i];
  return (
    <g opacity={clamp01(reveal * 5 - i)}>
      {active && <rect x={GAUGE_X - 24} y={y - 34} width={GAUGE_W + 48} height={74} rx={12} fill={colors.WARM} opacity={0.1} stroke={colors.WARM} strokeWidth={1.5} />}
      {/* the rail: maintenance side red, correction side green */}
      <line x1={GAUGE_X} y1={y} x2={GAUGE_X + GAUGE_W / 2} y2={y} stroke={colors.NEGATIVE} strokeWidth={5} opacity={0.35} strokeLinecap="round" />
      <line x1={GAUGE_X + GAUGE_W / 2} y1={y} x2={GAUGE_X + GAUGE_W} y2={y} stroke={colors.POSITIVE} strokeWidth={5} opacity={0.35} strokeLinecap="round" />
      <line x1={GAUGE_X + GAUGE_W / 2} y1={y - 9} x2={GAUGE_X + GAUGE_W / 2} y2={y + 9} stroke={colors.GRID} strokeWidth={2} />
      {/* the marker */}
      <circle cx={mx} cy={y} r={13} fill={color} opacity={0.22} />
      <circle cx={mx} cy={y} r={7} fill={color} />
      {/* pair names on their sides */}
      <text x={GAUGE_X} y={y - 16} fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO} opacity={0.95}>
        {p.left}
      </text>
      <text x={GAUGE_X + GAUGE_W} y={y - 16} textAnchor="end" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO} opacity={0.95}>
        {p.right}
      </text>
      {/* the pair's named failure mode surfaces once it tips */}
      <text x={GAUGE_X} y={y + 28} fill={tipped ? colors.NEGATIVE : colors.MUTED} fontSize={11} fontFamily={MONO} opacity={tipped ? 0.95 : 0.45}>
        {tipped ? `→ ${p.failure}` : p.failure}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const gaugesU = s.get(scene.gaugesU);
  const row = Math.round(s.get(scene.focusRow));
  const focusU = s.get(scene.focusU);
  const pressureU = s.get(scene.pressureU);
  const loopU = s.get(scene.loopU);
  const spinU = s.get(scene.spinU);
  const figU = s.get(scene.figU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);

  // travelling spark on the coupling loop
  const sparkA = -Math.PI / 2 + spinU * 2 * Math.PI * 2;
  const spark = { x: LOOP_CX + LOOP_R * Math.cos(sparkA), y: LOOP_CY + LOOP_R * Math.sin(sparkA) };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        Five forces, one balance
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        the force-balance model · maintenance on the left, correction on the right
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          {/* ---- the five gauges ---- */}
          <g opacity={gaugesU * (1 - figU * 0.75)}>
            <rect x={520} y={104} width={660} height={492} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
            {PAIRS.map((_, i) => (
              <Gauge key={i} i={i} reveal={gaugesU} active={i === row && focusU > 0.05} pressure={pressureU} />
            ))}
            {pressureU > 0.5 && (
              <text x={850} y={584} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} opacity={clamp01(pressureU * 2 - 1)}>
                all five tip together — that synchrony is the regime
              </text>
            )}
          </g>

          {/* ---- the coupling loop ---- */}
          {loopU > 0 && (
            <g opacity={loopU * (1 - figU * 0.35)}>
              <circle cx={LOOP_CX} cy={LOOP_CY} r={LOOP_R} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={0.55} strokeDasharray="3 7" />
              {LOOP.map((label, i) => {
                const p = loopPos(i);
                const n = loopPos((i + 1) % LOOP.length);
                const mid = { x: (p.x + n.x) / 2, y: (p.y + n.y) / 2 };
                // arrowhead midway along each arc chord
                const dx = n.x - p.x;
                const dy = n.y - p.y;
                const len = Math.hypot(dx, dy) || 1;
                return (
                  <g key={label} opacity={clamp01(loopU * 5 - i)}>
                    <rect x={p.x - 88} y={p.y - 21} width={176} height={42} rx={10} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={10.5} fontFamily={MONO}>
                      {label}
                    </text>
                    <path
                      d={`M ${mid.x - (dx / len) * 8} ${mid.y - (dy / len) * 8} l ${(dx / len) * 14 - (dy / len) * 5} ${(dy / len) * 14 + (dx / len) * 5} l ${-(dx / len) * 14 - (dy / len) * 5} ${-(dy / len) * 14 + (dx / len) * 5}`}
                      fill={colors.WARM}
                      opacity={0.8}
                    />
                  </g>
                );
              })}
              {spinU > 0 && spinU < 1 && <circle cx={spark.x} cy={spark.y} r={7} fill={colors.WARM} />}
              <text x={LOOP_CX} y={LOOP_CY - 8} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO} fontWeight={700}>
                self-reinforcing
              </text>
              <text x={LOOP_CX} y={LOOP_CY + 14} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                each turn makes the next cheaper
              </text>
            </g>
          )}

          {/* ---- the paper's real Figure 1 ---- */}
          <Figure
            src="/generated/coherence-theater/figures/fig1-coupling.png"
            x={660}
            y={98}
            w={510}
            h={472}
            reveal={figU}
            opacity={figU}
            caption="paper Figure 1 · coupling effects: force-to-theater flow"
          />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={166} y={230} width={948} height={216} rx={28} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2.5} />
        <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={33} fontWeight={800}>
          Coupling turns pressure into a regime
        </text>
        <text x={640} y={340} textAnchor="middle" fill={colors.WARM} fontSize={18}>
          five tipped gauges, one loop — legible order becomes the path of least resistance
        </text>
        <text x={640} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          next: one artifact rides the loop through a hospital
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
