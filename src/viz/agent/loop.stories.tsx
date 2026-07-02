import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease } from '../core';
import type { TimelineOverrides } from '../core';
import { LoopRing } from './loop-ring';
import { MessageCard, messageCardHeight } from './message';
import { TokenStream } from './token-stream';
import { ToolCard } from './tool-card';
import { ContextBar } from './context-bar';
import overrides from './loop.overrides.json';

/**
 * The whole suite composed into one agent turn — tau's loop over the plain
 * Anthropic SDK: request goes up (system + transcript + tools), the model
 * streams, stops on tool_use, the harness executes, the tool_result is
 * appended, and the loop runs again until end_turn.
 */
const STOPS = [
  { label: 'request', color: colors.ACCENT },
  { label: 'model', color: colors.SECONDARY },
  { label: 'events', color: colors.TEAL },
  { label: 'tools', color: colors.WARM },
  { label: 'append', color: colors.POSITIVE },
];
const RING = { cx: 265, cy: 330, r: 150 };
// the "model" stop position — where token streams originate
const MODEL_A = -Math.PI / 2 + (1 / STOPS.length) * Math.PI * 2;
const MODEL = { x: RING.cx + RING.r * Math.cos(MODEL_A), y: RING.cy + RING.r * Math.sin(MODEL_A) };

const TX = 555;
const TW = 445;
const SYS = 'You are a coding agent. Use tools when you need facts.';
const USER = 'What is the weather in Paris?';
const A1 = 'tool_use → get_weather {"city": "Paris"}';
const TR = '{"temp_c": 18, "sky": "clear"}';
const A2 = 'It is 18 °C and clear in Paris right now.';

const gap = 13;
const Y_SYS = 78;
const Y_USER = Y_SYS + messageCardHeight(SYS, TW) + gap;
const Y_A1 = Y_USER + messageCardHeight(USER, TW) + gap;
const Y_TR = Y_A1 + messageCardHeight(A1, TW) + gap;
const Y_A2 = Y_TR + messageCardHeight(TR, TW) + gap;

function buildDemo() {
  const tl = new Timeline();
  const ringR = tl.channel('ringReveal', 0);
  const orbit = tl.channel('orbit', 0);
  const sysE = tl.channel('sysEnter', 0);
  const userE = tl.channel('userEnter', 0);
  const a1E = tl.channel('a1Enter', 0);
  const a1T = tl.channel('a1Text', 0);
  const tok1 = tl.channel('tokens1', 0);
  const toolU = tl.channel('toolCard', 0);
  const toolAct = tl.channel('toolActive', 0);
  const toolProg = tl.channel('toolProgress', 0);
  const resU = tl.channel('toolResult', 0);
  const trE = tl.channel('trEnter', 0);
  const trT = tl.channel('trText', 0);
  const a2E = tl.channel('a2Enter', 0);
  const a2T = tl.channel('a2Text', 0);
  const tok2 = tl.channel('tokens2', 0);
  const dimOld = tl.channel('dimOld', 0);
  const ctxSys = tl.channel('ctxSystem', 0);
  const ctxMsg = tl.channel('ctxMessages', 0);
  const ctxTool = tl.channel('ctxTools', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 4.6, text: 'One request goes up: system prompt, transcript, and the tool list.' });
  tl.tween(ringR, 1, { at: t - 4.2, dur: 1.3, ease: ease.draw });
  tl.tween(sysE, 1, { at: t - 3.4, dur: 0.5, ease: ease.enter });
  tl.tween(userE, 1, { at: t - 2.9, dur: 0.5, ease: ease.enter });
  tl.tween(toolU, 1, { at: t - 2.5, dur: 0.9, ease: ease.enter });
  tl.tween(ctxSys, 14_000, { at: t - 3.2, dur: 0.8, ease: ease.move });
  tl.tween(ctxMsg, 22_000, { at: t - 2.7, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.4);

  t = tl.caption({ at: t, dur: 5.0, text: 'The model streams — and stops early: stop_reason is "tool_use".' });
  tl.tween(orbit, 0.4, { at: t - 5.0, dur: 2.2, ease: ease.move });
  tl.tween(a1E, 1, { at: t - 4.2, dur: 0.5, ease: ease.enter });
  tl.tween(tok1, 1, { at: t - 4.0, dur: 2.4, ease: ease.linear });
  tl.tween(a1T, 1, { at: t - 3.7, dur: 2.4, ease: ease.linear });
  tl.tween(toolAct, 1, { at: t - 1.3, dur: 0.6, ease: ease.pulse });
  t = tl.hold(t, 0.4);

  t = tl.caption({ at: t, dur: 4.2, text: 'The harness executes the tool. The model just asked; it cannot act.' });
  tl.tween(orbit, 0.6, { at: t - 4.0, dur: 1.0, ease: ease.move });
  tl.tween(toolProg, 1, { at: t - 3.2, dur: 1.8, ease: ease.move });
  tl.tween(resU, 1, { at: t - 1.3, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.4);

  t = tl.caption({ at: t, dur: 4.2, text: 'The result is appended to the transcript as a tool_result block.' });
  tl.tween(orbit, 1.0, { at: t - 4.0, dur: 1.4, ease: ease.move });
  tl.tween(trE, 1, { at: t - 2.9, dur: 0.5, ease: ease.enter });
  tl.tween(trT, 1, { at: t - 2.5, dur: 1.1, ease: ease.linear });
  tl.tween(ctxTool, 16_000, { at: t - 2.4, dur: 0.9, ease: ease.move });
  tl.tween(toolAct, 0, { at: t - 2.8, dur: 0.7, ease: ease.pulse });
  t = tl.hold(t, 0.4);

  t = tl.caption({ at: t, dur: 5.0, text: 'Around again: it reads the result and answers. stop_reason: "end_turn".' });
  tl.tween(orbit, 1.4, { at: t - 5.0, dur: 1.6, ease: ease.move });
  tl.tween(dimOld, 0.7, { at: t - 4.4, dur: 1.0, ease: ease.move });
  tl.tween(a2E, 1, { at: t - 3.6, dur: 0.5, ease: ease.enter });
  tl.tween(tok2, 1, { at: t - 3.4, dur: 2.2, ease: ease.linear });
  tl.tween(a2T, 1, { at: t - 3.1, dur: 2.2, ease: ease.linear });
  tl.tween(ctxMsg, 30_000, { at: t - 2.2, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.3);

  t = tl.caption({ at: t, dur: 3.8, text: 'No tool calls left, so the loop ends. That cycle is the whole trick.' });
  tl.hold(t, 1.2);

  return {
    tl, ringR, orbit, sysE, userE, a1E, a1T, tok1, toolU, toolAct, toolProg,
    resU, trE, trT, a2E, a2T, tok2, dimOld, ctxSys, ctxMsg, ctxTool,
  };
}

const demo = buildDemo();
demo.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/agent/loop.overrides.json', slug: 'agent-loop' };

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop motion={MOTION}>
        {(s) => {
          const dim = s.get(demo.dimOld);
          return (
            <>
              <LoopRing {...RING} stops={STOPS} u={s.get(demo.orbit)} reveal={s.get(demo.ringR)} />
              <MessageCard x={TX} y={Y_SYS} w={TW} role="system" text={SYS} enter={s.get(demo.sysE)} dim={dim} />
              <MessageCard x={TX} y={Y_USER} w={TW} role="user" text={USER} enter={s.get(demo.userE)} dim={dim} />
              <MessageCard x={TX} y={Y_A1} w={TW} role="assistant" text={A1} u={s.get(demo.a1T)} enter={s.get(demo.a1E)} dim={dim} />
              <MessageCard x={TX} y={Y_TR} w={TW} role="tool" text={TR} u={s.get(demo.trT)} enter={s.get(demo.trE)} dim={dim} />
              <MessageCard x={TX} y={Y_A2} w={TW} role="assistant" text={A2} u={s.get(demo.a2T)} enter={s.get(demo.a2E)} glow={0.4 * s.get(demo.a2T)} />
              <ToolCard
                x={1035}
                y={Y_A1}
                w={225}
                name="get_weather"
                desc="Current weather by city"
                schema={[{ key: 'city', type: 'string', required: true }]}
                u={s.get(demo.toolU)}
                active={s.get(demo.toolAct)}
                progress={s.get(demo.toolProg)}
                result='18 °C, clear'
                resultU={s.get(demo.resU)}
              />
              <TokenStream from={MODEL} to={{ x: TX + 30, y: Y_A1 + 12 }} u={s.get(demo.tok1)} color={colors.SECONDARY} count={11} />
              <TokenStream from={MODEL} to={{ x: TX + 30, y: Y_A2 + 12 }} u={s.get(demo.tok2)} color={colors.SECONDARY} count={11} />
              <ContextBar
                x={TX}
                y={600}
                w={705}
                h={22}
                capacity={200_000}
                reveal={s.get(demo.ringR)}
                segments={[
                  { label: 'system', value: s.get(demo.ctxSys), color: colors.MUTED },
                  { label: 'messages', value: s.get(demo.ctxMsg), color: colors.ACCENT },
                  { label: 'tool_results', value: s.get(demo.ctxTool), color: colors.WARM },
                ]}
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Agent/The Agent Loop',
  component: Demo,
};
export default meta;

export const OneFullTurn: StoryObj<typeof Demo> = {};
