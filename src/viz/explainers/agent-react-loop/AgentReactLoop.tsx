// Explained: Agents — chapter 1: from predictor to actor. A real toy ReAct
// loop run at module scope: the question "which rover drove farther, and by
// how much" is answered by lookups against a module-scope fact table plus a
// computed subtraction (45.16 − 31.47 = 13.69 km) — every observation on
// screen is the actual value the toy tools return. The loop: thought →
// action → observation → append, around the LoopRing, until the answer.
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
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import { ContextBar, LoopRing, MessageCard } from '../../agent';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The toy world and the loop, actually run at module scope.
// ---------------------------------------------------------------------------

const ODOMETRY_KM: Record<string, number> = {
  opportunity: 45.16,
  curiosity: 31.47,
};

const lookup = (rover: string): number => ODOMETRY_KM[rover];

const A = lookup('opportunity'); // 45.16
const B = lookup('curiosity'); // 31.47
const DIFF = Number((A - B).toFixed(2)); // 13.69 — the computed answer

interface Turn { role: 'system' | 'user' | 'assistant' | 'tool'; label?: string; text: string }
const TRANSCRIPT: Turn[] = [
  { role: 'user', text: 'Which rover drove farther, Opportunity or Curiosity — and by how many km?' },
  { role: 'assistant', label: 'assistant · thought', text: 'I should not guess odometry. Look both up, then subtract.' },
  { role: 'assistant', label: 'assistant · action', text: 'lookup("opportunity")' },
  { role: 'tool', label: 'observation', text: `${A} km` },
  { role: 'assistant', label: 'assistant · action', text: 'lookup("curiosity")' },
  { role: 'tool', label: 'observation', text: `${B} km` },
  { role: 'assistant', label: 'assistant · action', text: `calc(${A} - ${B})` },
  { role: 'tool', label: 'observation', text: `${DIFF}` },
  { role: 'assistant', text: `Opportunity, by ${DIFF} km — from two lookups and one subtraction.` },
];

// rough token accounting for the context bar (chars/4)
const tokens = (t: Turn) => Math.max(8, Math.round(t.text.length / 4) + 6);

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const RING = { cx: 300, cy: 350, r: 130 };
const STOPS = [
  { label: 'prompt', color: colors.ACCENT },
  { label: 'thought', color: colors.SECONDARY },
  { label: 'action', color: colors.WARM },
  { label: 'observation', color: colors.POSITIVE },
];
const CARD_X = 560;
const CARD_W = 560;
const CARD_TOP = 120;

const CAM_RING: CameraState = { x: 380, y: 360, k: 1.25 };
const CAM_CARDS: CameraState = { x: 780, y: 380, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  guessU: ChannelRef<number>; // the predictor-only opening
  guessDim: ChannelRef<number>;
  ringU: ChannelRef<number>;
  orbit: ChannelRef<number>; // laps around the loop
  turns: ChannelRef<number>; // transcript cards revealed, 0..9
  ctxU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const guessU = tl.channel('guessU', 0);
  const guessDim = tl.channel('guessDim', 0);
  const ringU = tl.channel('ringU', 0);
  const orbit = tl.channel('orbit', 0);
  const turns = tl.channel('turns', 0);
  const ctxU = tl.channel('ctxU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the predictor alone
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Every book so far ends at the same place: a model that predicts the next token and stops. Ask it a question about the world and it answers from memory — one shot, no evidence.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(guessU, 1, { at: 1.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.0,
    text: 'This final book is about what happens when you close the loop: let the model act, show it what happened, and let it read its own results before speaking again.',
  });
  tl.tween(guessDim, 1, { at: 8.0, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_RING, { at: 8.6, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: 9.4, dur: 1.4, ease: ease.draw });
  tl.hold(11.9, 0.6);

  // Beat 2 — the loop, named
  tl.caption({
    at: 12.5,
    dur: 5.6,
    text: 'The shape is called a reason and act loop. Four stops: the prompt, a thought about what to do, an action — a tool call — and an observation, the tool result appended back into the context.',
  });
  tl.tween(orbit, 1, { at: 13.4, dur: 4.4, ease: ease.linear });
  tl.hold(18.3, 0.5);

  // Beat 3 — a real run
  tl.caption({
    at: 18.8,
    dur: 5.4,
    text: 'Watch a real run on a question with a checkable answer: which Mars rover drove farther, and by how much. The agent starts with a thought — do not guess odometry, look it up.',
  });
  tl.tween(cam, CAM_CARDS, { at: 19.1, dur: 1.5, ease: ease.move });
  tl.tween(turns, 2, { at: 20.0, dur: 1.6, ease: ease.linear });
  tl.tween(ctxU, 1, { at: 20.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 24.6,
    dur: 5.4,
    text: 'First action: look up Opportunity. The observation comes back — forty five point one six kilometers. That number was not remembered. It was fetched, and now it sits in the context as evidence.',
  });
  tl.tween(orbit, 2, { at: 25.0, dur: 2.6, ease: ease.linear });
  tl.tween(turns, 4, { at: 25.4, dur: 2.0, ease: ease.linear });
  tl.caption({
    at: 30.4,
    dur: 4.8,
    text: 'Around the loop again for Curiosity: thirty one point four seven. Each lap adds one verified fact — the transcript grows downward like a lab notebook.',
  });
  tl.tween(orbit, 3, { at: 30.8, dur: 2.4, ease: ease.linear });
  tl.tween(turns, 6, { at: 31.2, dur: 1.8, ease: ease.linear });
  tl.caption({
    at: 35.6,
    dur: 5.4,
    text: 'The third lap does the arithmetic with a calculator tool instead of in its head: forty five point one six minus thirty one point four seven is thirteen point six nine. Only now does the agent speak.',
  });
  tl.tween(orbit, 4, { at: 36.0, dur: 2.4, ease: ease.linear });
  tl.tween(turns, 9, { at: 36.4, dur: 2.6, ease: ease.linear });
  tl.hold(41.0, 0.6);

  // Beat 4 — what changed
  tl.caption({
    at: 41.6,
    dur: 5.8,
    text: 'Compare the two answers. The predictor produced a claim. The agent produced a claim plus a trail: two lookups and one subtraction that anyone can replay. Same words, completely different epistemic weight.',
  });
  tl.caption({
    at: 47.8,
    dur: 5.0,
    text: 'And notice the machinery is just the loop: nothing was fine-tuned, nothing new was trained. The intelligence is the model; the agency is the wiring around it.',
  });
  tl.hold(52.8, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 53.4,
    dur: 5.6,
    text: 'One question, three laps, one grounded answer. The rest of this book is what breaks when the questions get long — and what it takes to trust an agent that says it succeeded.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 53.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 54.4, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.4, dur: 0.9, ease: ease.enter });
  tl.hold(59.0, 1.2);

  return { tl, cam, titleU, guessU, guessDim, ringU, orbit, turns, ctxU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/agent-react-loop/overrides.json',
  slug: 'agent-react-loop',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const guessU = s.get(scene.guessU);
  const guessDim = s.get(scene.guessDim);
  const ringU = s.get(scene.ringU);
  const orbit = s.get(scene.orbit);
  const turns = s.get(scene.turns);
  const ctxU = s.get(scene.ctxU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  // transcript layout: stack cards, older ones dim slightly
  let y = CARD_TOP;
  const cards = TRANSCRIPT.map((t, i) => {
    const u = clamp01(turns - i);
    const textLen = Math.max(1, t.text.length);
    const h = 34 + Math.ceil(textLen / 62) * 16 + 10;
    const node = u > 0 && (
      <MessageCard
        key={i}
        x={CARD_X}
        y={y}
        w={CARD_W}
        role={t.role}
        label={t.label}
        text={t.text}
        enter={u}
        u={u}
        dim={turns > i + 3 ? 0.5 : 0}
        glow={i === TRANSCRIPT.length - 1 && turns > TRANSCRIPT.length - 1 ? 0.6 : 0}
      />
    );
    if (u > 0) y += h * Math.min(1, u) + 6;
    return node;
  });

  const shown = Math.floor(clamp01(turns / TRANSCRIPT.length) * TRANSCRIPT.length);
  const ctxTokens = TRANSCRIPT.slice(0, shown).reduce((a, t) => a + tokens(t), 0);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the predictor-only guess */}
          {guessU > 0 && (
            <g opacity={guessU * (1 - 0.8 * guessDim)}>
              <MessageCard
                x={180}
                y={140}
                w={480}
                role="assistant"
                label="predictor · one shot"
                text="Probably Opportunity? It drove quite far. Maybe forty-something kilometers."
                enter={guessU}
              />
              <text x={180} y={236} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                a claim with no trail behind it
              </text>
            </g>
          )}

          {/* the loop ring */}
          <LoopRing
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            stops={STOPS}
            reveal={ringU}
            u={orbit}
            color={colors.ACCENT}
          />
          {ringU >= 1 && (
            <text x={RING.cx} y={RING.cy + RING.r + 58} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace">
              laps: {Math.floor(orbit)} · one verified fact per lap
            </text>
          )}

          {/* the transcript */}
          {cards}
        </Camera>
      </g>

      {/* context bar pinned to screen space */}
      {ctxU > 0 && (
        <g opacity={ctxU * mainOp}>
          <ContextBar
            x={560}
            y={70}
            w={560}
            capacity={400}
            reveal={ctxU}
            title="the growing context"
            segments={[
              { label: 'transcript', value: ctxTokens, color: colors.ACCENT },
            ]}
          />
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          From predictor to actor
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Thought, action, observation — repeat.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            The agent answered 13.69 km with a replayable trail:
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            two lookups, one subtraction. Agency is the wiring, not the weights.
          </text>
        </g>
      )}
    </>
  );
}

export function AgentReactLoop() {
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
