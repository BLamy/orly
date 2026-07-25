// The sparse-reward problem — one pulse at the end of a long trajectory
//
// Grounding: Cameron R. Wolfe's Substack essay "Agentic World Models" (July
// 2026), synthesizing ECHO, "True Agents Model the World", PaW, and
// Qwen-AgentWorld. Standard multi-turn RL for tool-using agents (e.g. GRPO)
// scores an entire action/observation trajectory with exactly one outcome
// reward at the end; every intermediate observation (terminal output, search
// result, tool response) gets zero training signal even though it carries
// real information. The papers' fix, previewed here and detailed in chapter
// two: also train on the observation tokens with a supervised next-token
// objective on the SAME rollout, since supervised fine-tuning is
// mathematically RL with a constant positive advantage — giving one combined
// loss, dense on observations, sparse-reward-weighted on actions.
//
// Centerpiece: a persistent trajectory tape of action/observation cards. A
// ParticleCloud reward burst ignites only the final card under standard RL,
// then the SAME tape is relit card by card as a FunctionPlot signal curve
// above it morphs from a lone spike into a steady rhythm of bumps.
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
import { FunctionPlot, ParticleCloud } from '../../primitives';
import { scaleLinear } from 'd3';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — one persistent object: the trajectory tape.
// ---------------------------------------------------------------------------

type Kind = 'action' | 'observation';
interface Card {
  kind: Kind;
  label: string;
}
const CARDS: Card[] = [
  { kind: 'action', label: 'call a tool' },
  { kind: 'observation', label: 'terminal output' },
  { kind: 'action', label: 'call a tool' },
  { kind: 'observation', label: 'search result' },
  { kind: 'action', label: 'call a tool' },
  { kind: 'observation', label: 'tool response' },
  { kind: 'action', label: 'call a tool' },
  { kind: 'observation', label: 'file contents' },
  { kind: 'action', label: 'final answer' },
];
const N = CARDS.length;
const LAST = N - 1;
const OBS_IDX = CARDS.map((c, i) => (c.kind === 'observation' ? i : -1)).filter((i) => i >= 0);

const CARD_W = 96;
const CARD_H = 88;
const STEP = 122;
const X0 = 132;
const TAPE_Y = 400;
const xAt = (i: number): number => X0 + i * STEP;
const cxAt = (i: number): number => xAt(i) + CARD_W / 2;

// ---------------------------------------------------------------------------
// Real math at module scope — the signal curve above the tape.
// ---------------------------------------------------------------------------

const gauss = (x: number, mu: number, sigma: number): number =>
  Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));

/** standard RL: exactly one outcome reward, at the very last token */
const sparseSignal = (x: number): number => gauss(x, LAST, 0.32);
/** the paper's fix: keep the outcome reward, add dense supervision on every observation */
const denseSignal = (x: number): number =>
  Math.min(1, sparseSignal(x) + 0.62 * OBS_IDX.reduce((acc, i) => acc + gauss(x, i, 0.3), 0));

const sigX = scaleLinear().domain([0, LAST]).range([cxAt(0), cxAt(LAST)]);
const sigY = scaleLinear().domain([0, 1]).range([330, 168]);

// seeded burst particles for the reward pulse (module scope — deterministic)
const burstRand = mulberry32(7);
const BURST_N = 130;
const BURST_PTS = Array.from({ length: BURST_N }, () => ({
  angle: burstRand() * Math.PI * 2,
  dist: 0.25 + burstRand() * 0.75,
  alphaSeed: 0.35 + burstRand() * 0.65,
  r: 1.4 + burstRand() * 2.2,
}));

// camera marks
const CAM_WIDE: CameraState = { x: 660, y: 330, k: 0.95 };
const CAM_FINAL: CameraState = { x: cxAt(LAST) - 30, y: TAPE_Y + 10, k: 2.1 };
const CAM_REPLAY: CameraState = { x: 660, y: 300, k: 1.05 };
const CAM_EQ: CameraState = { x: 640, y: 360, k: 1 };

// ---------------------------------------------------------------------------
// Timeline (~96s, eleven beats)
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  const tapeU = tl.channel('tapeU', 0); // cards stagger onto the stage
  const dimU = tl.channel('dimU', 0); // 1 = everything but the last card is dark
  const sigRevealU = tl.channel('sigRevealU', 0); // sparse signal curve draws on
  const burstU = tl.channel('burstU', 0); // reward particle burst envelope
  const denseMorphU = tl.channel('denseMorphU', 0); // curve morphs sparse -> dense
  const glowU = tl.channel('glowU', 0); // observation cards relight together
  const eqU = tl.channel('eqU', 0); // combined-loss equation
  const endU = tl.channel('endU', 0); // closing quiet-down

  // — beat 1 · the trajectory —
  tl.caption({
    at: 0.5,
    dur: 7.2,
    text: 'Picture an agent working through a long task: call a tool, read what comes back, call another tool, read again, dozens of times before it ever answers.',
  });
  tl.tween(cam, CAM_WIDE, { at: 0.5, dur: 1.6, ease: ease.move });
  tl.tween(tapeU, 1, { at: 0.9, dur: 3.2, ease: ease.linear });
  tl.hold(7.9, 0.6);

  // — beat 2 · one outcome reward —
  tl.caption({
    at: 8.5,
    dur: 6.6,
    text: 'Standard training treats that entire chain as one move, and hands out exactly one reward at the very end: success or failure.',
  });
  tl.tween(cam, CAM_FINAL, { at: 8.7, dur: 1.8, ease: ease.move });
  tl.tween(dimU, 1, { at: 9.2, dur: 1.4, ease: ease.move });
  tl.hold(15.3, 0.5);

  // — beat 3 · the pulse ignites, alone —
  tl.caption({
    at: 15.8,
    dur: 6.4,
    text: 'Watch the tape. A single reward pulse ignites on the last step, and everything before it stays dark.',
  });
  tl.tween(sigRevealU, 1, { at: 16.0, dur: 1.4, ease: ease.draw });
  tl.tween(burstU, 1, { at: 16.4, dur: 0.9, ease: ease.pop });
  tl.tween(burstU, 0.55, { at: 18.0, dur: 1.6, ease: ease.move });
  tl.hold(22.4, 0.5);

  // — beat 4 · the waste —
  tl.caption({
    at: 23.0,
    dur: 7.4,
    text: 'That pulse has to explain every choice along the way, but it only ever touches the final token. Every intermediate observation gets zero training signal.',
  });
  tl.tween(cam, CAM_WIDE, { at: 23.2, dur: 1.6, ease: ease.move });
  tl.tween(burstU, 0.15, { at: 23.4, dur: 1.4, ease: ease.move });
  tl.hold(30.6, 0.5);

  // — beat 5 · the observations are not empty —
  tl.caption({
    at: 31.2,
    dur: 7.6,
    text: 'And that is wasteful, because those observations are not empty. A terminal output, a search result, a tool response: each one carries real information.',
  });
  tl.tween(cam, CAM_REPLAY, { at: 31.4, dur: 1.6, ease: ease.move });
  tl.hold(39.0, 0.6);

  // — beat 6 · relight the same tape —
  tl.caption({
    at: 39.6,
    dur: 6.8,
    text: 'So the fix keeps the exact same rollout, but reads it twice. Watch the tape relight, card by card.',
  });
  tl.tween(dimU, 0, { at: 39.8, dur: 1.6, ease: ease.move });
  tl.tween(burstU, 0, { at: 39.8, dur: 1.0, ease: ease.move });
  tl.hold(46.6, 0.5);

  // — beat 7 · dense glow on every observation —
  tl.caption({
    at: 47.2,
    dur: 7.0,
    text: 'Every observation card now gets a glow of its own: a supervised loss that predicts its own tokens, no reward required.',
  });
  tl.tween(glowU, 1, { at: 47.4, dur: 2.4, ease: ease.draw });
  tl.hold(54.4, 0.5);

  // — beat 8 · the curve morphs —
  tl.caption({
    at: 55.0,
    dur: 7.4,
    text: 'Underneath, the signal curve tells the story: a lonely spike at the end becomes a steady rhythm of bumps at every single observation.',
  });
  tl.tween(cam, CAM_REPLAY, { at: 55.2, dur: 1.4, ease: ease.move });
  tl.tween(denseMorphU, 1, { at: 55.6, dur: 2.6, ease: ease.draw });
  tl.hold(62.6, 0.6);

  // — beat 9 · why it's free —
  tl.caption({
    at: 63.2,
    dur: 7.6,
    text: 'This trick is nearly free, because a supervised loss is secretly a reinforcement loss with a constant positive advantage, so both can share one rollout.',
  });
  tl.hold(71.0, 0.6);

  // — beat 10 · the combined loss —
  tl.caption({
    at: 71.6,
    dur: 7.2,
    text: 'One combined loss does both jobs at once: action tokens keep their reinforcement weighting, observation tokens get their supervised weighting.',
  });
  tl.tween(cam, CAM_EQ, { at: 71.8, dur: 1.4, ease: ease.move });
  tl.tween(eqU, 1, { at: 73.2, dur: 1.0, ease: ease.enter });
  tl.hold(79.0, 0.6);

  // — beat 11 · closing: the stakes —
  tl.caption({
    at: 79.8,
    dur: 8.0,
    text: 'That is the stakes of this whole story: a long trajectory with one reward pulse at the end, versus dense supervision at every single step along the way.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 80.0, dur: 1.6, ease: ease.move });
  tl.tween(endU, 1, { at: 81.2, dur: 1.4, ease: ease.move });
  tl.hold(88.2, 1.8);

  return {
    tl,
    cam,
    tapeU,
    dimU,
    sigRevealU,
    burstU,
    denseMorphU,
    glowU,
    eqU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function TapeCard({
  i,
  u,
  dim,
  glow,
  finalFlash,
}: {
  i: number;
  u: number;
  dim: number;
  glow: number;
  finalFlash: number;
}) {
  if (u <= 0) return null;
  const card = CARDS[i];
  const isObs = card.kind === 'observation';
  const color = isObs ? colors.SECONDARY : colors.ACCENT;
  const isLast = i === LAST;
  const darken = isLast ? 0 : dim * 0.72;
  const opacity = u * (1 - darken);
  const lit = isLast ? finalFlash : isObs ? glow : 0;
  return (
    <g opacity={opacity} transform={`translate(0 ${10 * (1 - u)})`}>
      {lit > 0.05 && (
        <rect
          x={xAt(i) - 8}
          y={TAPE_Y - 8}
          width={CARD_W + 16}
          height={CARD_H + 16}
          rx={16}
          fill={isLast ? colors.WARM : color}
          opacity={0.22 * lit}
        />
      )}
      <rect
        x={xAt(i)}
        y={TAPE_Y}
        width={CARD_W}
        height={CARD_H}
        rx={12}
        fill={colors.PANEL}
        stroke={isLast ? colors.WARM : color}
        strokeWidth={1.6}
        strokeOpacity={0.4 + 0.6 * Math.max(lit, isLast ? finalFlash : 0)}
      />
      <text x={cxAt(i)} y={TAPE_Y + 24} textAnchor="middle" fill={color} fontSize={10.5} fontFamily={MONO}>
        {card.kind}
      </text>
      <text x={cxAt(i)} y={TAPE_Y + 52} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontWeight={600}>
        {card.label}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tapeU = s.get(scene.tapeU);
  const dimU = s.get(scene.dimU);
  const sigRevealU = s.get(scene.sigRevealU);
  const burstU = s.get(scene.burstU);
  const denseMorphU = s.get(scene.denseMorphU);
  const glowU = s.get(scene.glowU);
  const eqU = s.get(scene.eqU);
  const endU = s.get(scene.endU);

  const stageFade = 1 - 0.88 * endU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageFade}>
          {/* the signal curve above the tape */}
          <text x={X0} y={148} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
            training signal along the trajectory
          </text>
          <FunctionPlot
            x={sigX}
            y={sigY}
            f={denseSignal}
            morph={{ from: sparseSignal, u: denseMorphU }}
            domain={[0, LAST]}
            reveal={sigRevealU}
            color={denseMorphU > 0.02 ? colors.SECONDARY : colors.WARM}
            width={3}
          />

          {/* the tape */}
          {CARDS.map((_, i) => (
            <TapeCard key={i} i={i} u={win(tapeU, N, i, 3)} dim={dimU} glow={glowU} finalFlash={Math.max(dimU, glowU > 0 ? 0.4 : 0) + 0.6 * (dimU > 0 ? 1 : 0)} />
          ))}

          {/* reward burst — the centerpiece particle cloud */}
          <ParticleCloud
            state={s}
            r={2}
            color={colors.WARM}
            compute={() => {
              const u = burstU;
              if (u <= 0.01) return [];
              const cx = cxAt(LAST);
              const cy = TAPE_Y + CARD_H / 2;
              return BURST_PTS.map((p) => {
                const radius = p.dist * (18 + 150 * u);
                return {
                  x: cx + Math.cos(p.angle) * radius,
                  y: cy + Math.sin(p.angle) * radius * 0.7,
                  r: p.r,
                  alpha: p.alphaSeed * u,
                  color: colors.WARM,
                };
              });
            }}
          />
        </g>

        {/* the combined loss */}
        {eqU > 0.01 && (
          <g opacity={eqU}>
            <rect x={280} y={470} width={720} height={96} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.7} />
            <MathLabel
              tex={'\\mathcal{L} = m_{\\text{action}} \\cdot \\mathcal{L}_{\\text{GRPO}} + m_{\\text{obs}} \\cdot \\mathcal{L}_{\\text{supervised}}'}
              x={640}
              y={510}
              fontSize={26}
            />
            <text x={640} y={548} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
              one loss, two masks: reinforcement on actions, supervision on observations
            </text>
          </g>
        )}

        {/* closing card */}
        {endU > 0.01 && (
          <g opacity={endU}>
            <rect x={190} y={250} width={900} height={190} rx={20} fill={colors.PANEL} stroke={colors.ACCENT} strokeOpacity={0.55} />
            <text x={640} y={320} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={600}>
              one pulse at the end, or supervision at every step
            </text>
            <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              the same rollout, read twice
            </text>
            <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              GRPO loss on actions + supervised loss on observations
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
