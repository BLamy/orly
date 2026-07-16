// Book scene — codex-app-server, chapter 2: "Threads, Turns, Items".
//
// ONE persistent object: a transcript structure that BUILDS ITSELF on the left
// while the raw notification log scrolls on the right — the same events, two
// projections. Grounded in codex-rs/app-server/README.md (Core Primitives:
// Thread → Turn → Item; Turn events: turn/started, item/started,
// item/commandExecution/outputDelta, item/agentMessage/delta, item/completed,
// turn/completed with token usage) and bespoke_event_handling.rs (core
// EventMsg::* mapped onto those typed notifications).
import type { ReactNode } from 'react';
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { TokenStream } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const NOUNS = { x: 250, y: 100, w: 780, h: 92 };
const THREAD = { x: 70, y: 120, w: 620, h: 470 };
const TURN = { x: 92, y: 186, w: 576, h: 384 };
const LOG = { x: 740, y: 120, w: 480, rowH: 30 };

const CARD_X = TURN.x + 18;
const CARD_W = TURN.w - 36;
const USER = { y: 236, h: 54 };
const CMD = { y: 302, h: 130 };
const AGENT = { y: 444, h: 74 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_NOUNS: CameraState = { x: 640, y: 200, k: 1.1 };
const CAM_BOTH: CameraState = { x: 645, y: 355, k: 1.0 };
const CAM_THREAD: CameraState = { x: 460, y: 300, k: 1.12 };
const CAM_CMD: CameraState = { x: 480, y: 370, k: 1.2 };
const CAM_AGENT: CameraState = { x: 500, y: 440, k: 1.18 };
const CAM_LOG: CameraState = { x: 880, y: 330, k: 1.14 };
const CAM_WIDE: CameraState = { x: 645, y: 350, k: 0.97 };

const OUTPUT_LINES = ['> vitest run', ' ✓ engine/timeline.test.ts (18)', ' ✓ engine/player.test.ts (24)'];
const AGENT_TEXT = 'All 42 tests pass. The player race in seek() is fixed.';

// The raw wire, in order — each row lands as the left side renders it.
const LOG_ROWS: { method: string; color: string }[] = [
  { method: 'thread/started', color: colors.SECONDARY },
  { method: 'turn/started', color: colors.SECONDARY },
  { method: 'item/started            userMessage', color: colors.ACCENT },
  { method: 'item/completed          userMessage', color: colors.POSITIVE },
  { method: 'item/started            commandExecution', color: colors.ACCENT },
  { method: 'item/commandExecution/outputDelta', color: colors.MUTED },
  { method: 'item/commandExecution/outputDelta', color: colors.MUTED },
  { method: 'item/completed          exitCode: 0', color: colors.POSITIVE },
  { method: 'item/started            agentMessage', color: colors.ACCENT },
  { method: 'item/agentMessage/delta ×14', color: colors.MUTED },
  { method: 'item/completed          agentMessage', color: colors.POSITIVE },
  { method: 'turn/completed          tokens: 5,214', color: colors.WARM },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const nounsU = tl.channel('nounsU', 0); // thread ⊃ turn ⊃ item diagram
  const nounsDim = tl.channel('nounsDim', 0);
  const threadU = tl.channel('threadU', 0);
  const turnU = tl.channel('turnU', 0);
  const userU = tl.channel('userU', 0); // 0 none, 0.5 started(outline), 1 completed
  const cmdU = tl.channel('cmdU', 0);
  const outU = tl.channel('outU', 0); // output delta lines
  const cmdDone = tl.channel('cmdDone', 0); // exit stamp
  const agentU = tl.channel('agentU', 0);
  const textU = tl.channel('textU', 0); // agent text typing
  const streamU = tl.channel('streamU', 0); // token stream flight
  const agentDone = tl.channel('agentDone', 0);
  const sealU = tl.channel('sealU', 0); // turn/completed seal
  const logN = tl.channel('logN', 0); // how many log rows have landed
  const leftDim = tl.channel('leftDim', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · three nouns — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'A conversation with Codex looks like chat. Underneath it is three nested nouns: a thread holds turns, a turn holds items — and items are everything the agent actually did.',
  });
  tl.tween(cam, CAM_NOUNS, { at: t - 6.8, dur: 1.3, ease: ease.move });
  tl.tween(nounsU, 1, { at: t - 6.0, dur: 1.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 2 · two projections — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Watch both sides of the wire at once. On the left, what your interface renders. On the right, the raw notifications the engine emits.',
  });
  tl.tween(nounsDim, 1, { at: t - 5.6, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_BOTH, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.4);

  /* — beat 3 · thread/start — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'It starts with thread start. The engine creates the conversation, hands back its id, and from now on this connection is subscribed to everything that happens inside it.',
  });
  tl.tween(threadU, 1, { at: t - 5.2, dur: 1.2, ease: ease.draw });
  tl.tween(logN, 1, { at: t - 3.8, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 4 · turn/start — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'Then turn start, carrying the user input — run the tests. The reply comes back immediately: here is your new turn, status in progress. The real answer arrives as a stream.',
  });
  tl.tween(cam, CAM_THREAD, { at: t - 6.2, dur: 1.3, ease: ease.move });
  tl.tween(turnU, 1, { at: t - 4.8, dur: 1.0, ease: ease.draw });
  tl.tween(logN, 2, { at: t - 3.6, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 5 · item lifecycle, user message — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Every unit of work lives the same three step life: item started, some deltas, item completed. First in is the user message itself.',
  });
  tl.tween(userU, 0.5, { at: t - 4.6, dur: 0.5, ease: ease.enter });
  tl.tween(logN, 3, { at: t - 4.4, dur: 0.3, ease: ease.pop });
  tl.tween(userU, 1, { at: t - 2.6, dur: 0.5, ease: ease.pop });
  tl.tween(logN, 4, { at: t - 2.4, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 6 · commandExecution starts — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Now the agent acts. An item starts for a command execution — the exact command, the working directory — so your interface can draw it the moment it begins.',
  });
  tl.tween(cam, CAM_CMD, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(cmdU, 0.5, { at: t - 4.2, dur: 0.6, ease: ease.enter });
  tl.tween(logN, 5, { at: t - 4.0, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 7 · output deltas — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Output streams in as deltas while the command runs. Your interface appends them live — nobody waits for the end to show progress.',
  });
  tl.tween(outU, 1, { at: t - 5.0, dur: 2.6, ease: ease.linear });
  tl.tween(logN, 7, { at: t - 4.6, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 8 · completed is authoritative — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Item completed closes it out with the exit code and duration — the authoritative result, the thing to trust over any delta you rendered along the way.',
  });
  tl.tween(cmdU, 1, { at: t - 4.8, dur: 0.5, ease: ease.pop });
  tl.tween(cmdDone, 1, { at: t - 4.6, dur: 0.5, ease: ease.pop });
  tl.tween(logN, 8, { at: t - 4.4, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 9 · agent message streams — */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'The reply works the same way: an agent message item opens, and text arrives token by token through deltas that your interface concatenates in order.',
  });
  tl.tween(cam, CAM_AGENT, { at: t - 6.4, dur: 1.3, ease: ease.move });
  tl.tween(agentU, 0.5, { at: t - 5.2, dur: 0.5, ease: ease.enter });
  tl.tween(logN, 10, { at: t - 5.0, dur: 2.4, ease: ease.linear });
  tl.tween(streamU, 1, { at: t - 4.8, dur: 3.2, ease: ease.linear });
  tl.tween(textU, 1, { at: t - 4.4, dur: 3.2, ease: ease.linear });
  tl.tween(agentU, 1, { at: t - 0.8, dur: 0.4, ease: ease.pop });
  tl.tween(agentDone, 1, { at: t - 0.8, dur: 0.4, ease: ease.pop });
  tl.tween(logN, 11, { at: t - 0.7, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 10 · turn/completed seals — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'When the model finishes, turn completed seals the whole thing — final status, plus the tokens this turn consumed.',
  });
  tl.tween(cam, CAM_THREAD, { at: t - 5.2, dur: 1.3, ease: ease.move });
  tl.tween(sealU, 1, { at: t - 3.6, dur: 0.7, ease: ease.pop });
  tl.tween(logN, 12, { at: t - 3.4, dur: 0.3, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 11 · the trick — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'That is the whole trick of building on the app server: you are not calling functions and painting return values. You are replaying a stream.',
  });
  tl.tween(cam, CAM_LOG, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(leftDim, 1, { at: t - 5.0, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 12 · close — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Render the items, respect the three step life, trust completed over deltas — and a chat window simply falls out of the protocol.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.6, dur: 1.6, ease: ease.move });
  tl.tween(leftDim, 0, { at: t - 4.6, dur: 1.0, ease: ease.move });
  tl.tween(dimU, 0.35, { at: t - 2.0, dur: 1.2, ease: ease.move });
  tl.hold(t, 1.0);

  return {
    tl, cam, nounsU, nounsDim, threadU, turnU, userU, cmdU, outU, cmdDone,
    agentU, textU, streamU, agentDone, sealU, logN, leftDim, dimU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** Thread ⊃ Turn ⊃ Item — the three nouns, nested. */
function Nouns({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = NOUNS;
  const u1 = clamp01(e * 3);
  const u2 = clamp01(e * 3 - 1);
  const u3 = clamp01(e * 3 - 2);
  return (
    <g opacity={1 - clamp01(dim)}>
      <g opacity={u1}>
        <rect x={x} y={y} width={w} height={h} rx={12} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} />
        <text x={x + 14} y={y + 24} fill={colors.SECONDARY} fontSize={13} fontWeight={700}>Thread</text>
        <text x={x + 90} y={y + 24} fill={colors.MUTED} fontSize={11.5}>one conversation</text>
      </g>
      <g opacity={u2}>
        <rect x={x + 190} y={y + 12} width={w - 210} height={h - 24} rx={10} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
        <text x={x + 204} y={y + 34} fill={colors.ACCENT} fontSize={13} fontWeight={700}>Turn</text>
        <text x={x + 254} y={y + 34} fill={colors.MUTED} fontSize={11.5}>user input → agent answer</text>
      </g>
      <g opacity={u3}>
        <rect x={x + 420} y={y + 40} width={w - 450} height={h - 62} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
        <text x={x + 434} y={y + 60} fill={colors.POSITIVE} fontSize={13} fontWeight={700}>Item</text>
        <text x={x + 486} y={y + 60} fill={colors.MUTED} fontSize={11.5}>message · command · edit · tool call</text>
      </g>
    </g>
  );
}

/** An item card with the started(outline) → completed(solid) lifecycle. */
function ItemCard({
  y, h, u, done, title, color, children,
}: {
  y: number; h: number; u: number; done: number; title: string; color: string; children?: ReactNode;
}) {
  const e = clamp01(u * 2); // 0..0.5 → entering
  if (e <= 0) return null;
  const completed = u >= 0.99;
  return (
    <g transform={`translate(${CARD_X}, ${y + (1 - clamp01(e)) * 10})`} opacity={clamp01(e)}>
      <rect
        width={CARD_W}
        height={h}
        rx={9}
        fill={colors.PANEL}
        stroke={completed ? color : colors.MUTED}
        strokeWidth={1.5}
        strokeDasharray={completed ? undefined : '5 4'}
        opacity={completed ? 1 : 0.9}
      />
      <text x={12} y={19} fill={color} fontSize={11} fontWeight={700} fontFamily={mono}>
        {title}
      </text>
      {clamp01(done) > 0.5 && (
        <text x={CARD_W - 12} y={19} fill={colors.POSITIVE} fontSize={11} fontWeight={700} fontFamily={mono} textAnchor="end">
          ✓ completed
        </text>
      )}
      {children}
    </g>
  );
}

/** The raw notification log — the right-hand projection of the same events. */
function WireLog({ n, dim }: { n: number; dim: number }) {
  const { x, y, w, rowH } = LOG;
  return (
    <g opacity={1 - 0.6 * clamp01(dim)}>
      <text x={x} y={y - 12} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        ◂ stdout — notifications
      </text>
      {LOG_ROWS.map((row, i) => {
        const ru = clamp01(n - i);
        if (ru <= 0) return null;
        return (
          <g key={i} transform={`translate(${x}, ${y + i * rowH + (1 - ru) * 8})`} opacity={ru}>
            <rect width={w} height={rowH - 6} rx={6} fill={colors.BG} stroke={colors.GRID} strokeWidth={1} />
            <circle cx={14} cy={(rowH - 6) / 2} r={3} fill={row.color} />
            <text x={26} y={(rowH - 6) / 2 + 4} fill={row.color === colors.MUTED ? colors.MUTED : row.color} fontSize={11} fontFamily={mono}>
              {row.method}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const leftDim = Math.max(clamp01(s.get(scene.leftDim)), dim);
  const threadU = clamp01(s.get(scene.threadU));
  const turnU = clamp01(s.get(scene.turnU));
  const outN = clamp01(s.get(scene.outU)) * OUTPUT_LINES.length;
  const textChars = Math.round(clamp01(s.get(scene.textU)) * AGENT_TEXT.length);
  const sealU = clamp01(s.get(scene.sealU));
  const streamU = clamp01(s.get(scene.streamU));

  return (
    <>
      <Nouns u={s.get(scene.nounsU)} dim={Math.max(clamp01(s.get(scene.nounsDim)), dim)} />

      {/* the thread container */}
      {threadU > 0 && (
        <g opacity={(1 - 0.55 * leftDim) * threadU}>
          <rect x={THREAD.x} y={THREAD.y} width={THREAD.w} height={THREAD.h * threadU} rx={14} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={THREAD.x + 16} y={THREAD.y + 28} fill={colors.SECONDARY} fontSize={12.5} fontWeight={700} fontFamily={mono}>
            thread thr_0aa4
          </text>
          <text x={THREAD.x + THREAD.w - 16} y={THREAD.y + 28} fill={colors.MUTED} fontSize={11} fontFamily={mono} textAnchor="end">
            subscribed ✓
          </text>
        </g>
      )}

      {/* the turn segment */}
      {turnU > 0 && (
        <g opacity={(1 - 0.55 * leftDim) * turnU}>
          <rect
            x={TURN.x} y={TURN.y} width={TURN.w} height={TURN.h * turnU} rx={11}
            fill="none" stroke={sealU > 0.5 ? colors.POSITIVE : colors.ACCENT} strokeWidth={sealU > 0.5 ? 2 : 1.5}
          />
          <text x={TURN.x + 14} y={TURN.y + 24} fill={colors.ACCENT} fontSize={12} fontWeight={700} fontFamily={mono}>
            turn turn_7c
          </text>
          <text x={TURN.x + TURN.w - 14} y={TURN.y + 24} fill={sealU > 0.5 ? colors.POSITIVE : colors.WARM} fontSize={11.5} fontFamily={mono} textAnchor="end">
            {sealU > 0.5 ? 'completed · tokens 5,214' : 'status: inProgress'}
          </text>
        </g>
      )}

      <g opacity={1 - 0.55 * leftDim}>
        <ItemCard y={USER.y} h={USER.h} u={s.get(scene.userU)} done={s.get(scene.userU) >= 0.99 ? 1 : 0} title="userMessage" color={colors.ACCENT}>
          <text x={12} y={40} fill={colors.TEXT} fontSize={13}>Run the tests</text>
        </ItemCard>

        <ItemCard y={CMD.y} h={CMD.h} u={s.get(scene.cmdU)} done={s.get(scene.cmdDone)} title="commandExecution" color={colors.WARM}>
          <text x={12} y={40} fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>npm test</text>
          <text x={110} y={40} fill={colors.MUTED} fontSize={11} fontFamily={mono}>cwd: ~/project</text>
          {OUTPUT_LINES.map((line, i) => {
            const lu = clamp01(outN - i);
            if (lu <= 0) return null;
            return (
              <text key={i} x={12} y={62 + i * 18} fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={lu}>
                {line}
              </text>
            );
          })}
          {clamp01(s.get(scene.cmdDone)) > 0.5 && (
            <text x={12} y={CMD.h - 12} fill={colors.POSITIVE} fontSize={11.5} fontWeight={700} fontFamily={mono}>
              exitCode: 0 · durationMs: 2140
            </text>
          )}
        </ItemCard>

        <ItemCard y={AGENT.y} h={AGENT.h} u={s.get(scene.agentU)} done={s.get(scene.agentDone)} title="agentMessage" color={colors.POSITIVE}>
          <text x={12} y={44} fill={colors.TEXT} fontSize={13}>
            {AGENT_TEXT.slice(0, textChars)}
            {textChars > 0 && textChars < AGENT_TEXT.length ? '▌' : ''}
          </text>
        </ItemCard>
      </g>

      {/* deltas flying from the wire into the agent message */}
      {streamU > 0 && streamU < 1 && (
        <TokenStream
          from={{ x: LOG.x + 30, y: LOG.y + 9 * LOG.rowH }}
          to={{ x: CARD_X + CARD_W - 40, y: AGENT.y + 36 }}
          u={streamU}
          count={14}
          color={colors.POSITIVE}
          bend={-0.18}
          opacity={1 - 0.55 * leftDim}
        />
      )}

      <WireLog n={s.get(scene.logN)} dim={dim} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
