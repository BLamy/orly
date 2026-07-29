import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease } from '../core';
import type { TimelineOverrides } from '../core';
import { MessageCard, messageCardHeight } from './message';
import { TokenStream } from './token-stream';
import overrides from './message.overrides.json';

/**
 * The transcript vocabulary: append-only MessageCards (role chip + streaming
 * monospace body) fed by a TokenStream — one linear 0→1 channel drives both
 * the flying tokens and the character reveal, so scrubbing stays honest.
 */
const W = 520;
const X = 380;
const SYS = 'You are a coding agent. Answer with evidence from the repo.';
const USER = 'What does src/core/timeline.ts export?';
const ASST =
  'Timeline is the core export — a pure sample(t) machine, plus channel(), tween(), and caption() builders.';

const stackY = (prev: number, text: string) => prev + messageCardHeight(text, W) + 16;
const Y_SYS = 120;
const Y_USER = stackY(Y_SYS, SYS);
const Y_ASST = stackY(Y_USER, USER);

function buildDemo() {
  const tl = new Timeline();
  const sysE = tl.channel('sysEnter', 0);
  const userE = tl.channel('userEnter', 0);
  const userT = tl.channel('userText', 0);
  const asstE = tl.channel('asstEnter', 0);
  const asstT = tl.channel('asstText', 0);
  const tok = tl.channel('tokens', 0);
  const dimOld = tl.channel('dimOld', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.6, text: 'A transcript is append-only: each turn is a role plus content.' });
  tl.tween(sysE, 1, { at: t - 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(userE, 1, { at: t - 2.6, dur: 0.6, ease: ease.enter });
  tl.tween(userT, 1, { at: t - 2.2, dur: 1.2, ease: ease.linear });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 4.6, text: 'The reply streams in — one 0→1 channel drives tokens and text.' });
  tl.tween(asstE, 1, { at: t - 4.2, dur: 0.5, ease: ease.enter });
  tl.tween(tok, 1, { at: t - 4.0, dur: 3.0, ease: ease.linear });
  tl.tween(asstT, 1, { at: t - 3.6, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 3.2, text: 'Older turns dim — but they are the state the next request resends.' });
  tl.tween(dimOld, 1, { at: t - 2.6, dur: 0.9, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, sysE, userE, userT, asstE, asstT, tok, dimOld };
}

const demo = buildDemo();
demo.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/agent/message.overrides.json', slug: 'agent-message' };

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop motion={MOTION}>
        {(s) => (
          <>
            <MessageCard x={X} y={Y_SYS} w={W} role="system" text={SYS} enter={s.get(demo.sysE)} dim={s.get(demo.dimOld)} />
            <MessageCard x={X} y={Y_USER} w={W} role="user" text={USER} u={s.get(demo.userT)} enter={s.get(demo.userE)} dim={s.get(demo.dimOld)} />
            <MessageCard x={X} y={Y_ASST} w={W} role="assistant" text={ASST} u={s.get(demo.asstT)} enter={s.get(demo.asstE)} />
            <TokenStream
              from={{ x: 1080, y: 200 }}
              to={{ x: X + W - 40, y: Y_ASST + 10 }}
              u={s.get(demo.tok)}
              count={12}
              color={colors.SECONDARY}
            />
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Agent/MessageCard & TokenStream',
  component: Demo,
};
export default meta;

export const StreamingTranscript: StoryObj<typeof Demo> = {};
