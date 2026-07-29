import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, ease } from '../core';
import type { TimelineOverrides } from '../core';
import { ToolCard } from './tool-card';
import overrides from './tool-card.overrides.json';

/**
 * The tool lifecycle: definition reveals (name, description, input_schema
 * rows), the model picks it (`tool_use` → glow), the harness executes
 * (dial), and a result lands — success on one card, `is_error: true` on the
 * other. "A tool is a name, a description, a JSON input schema, and an
 * async executor that returns a structured result."
 */
const READ_SCHEMA = [
  { key: 'path', type: 'string', required: true },
  { key: 'offset', type: 'integer' },
  { key: 'limit', type: 'integer' },
];
const TEST_SCHEMA = [
  { key: 'suite', type: 'string', required: true },
  { key: 'watch', type: 'boolean' },
];

function buildDemo() {
  const tl = new Timeline();
  const u1 = tl.channel('card1', 0);
  const u2 = tl.channel('card2', 0);
  const act1 = tl.channel('active1', 0);
  const prog1 = tl.channel('progress1', 0);
  const res1 = tl.channel('result1', 0);
  const act2 = tl.channel('active2', 0);
  const prog2 = tl.channel('progress2', 0);
  const res2 = tl.channel('result2', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 4.0, text: 'A tool is a name, a description, a schema — and an executor.' });
  tl.tween(u1, 1, { at: t - 3.6, dur: 1.1, ease: ease.enter });
  tl.tween(u2, 1, { at: t - 3.2, dur: 1.1, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 4.4, text: 'A tool_use block names one — the harness runs it, not the model.' });
  tl.tween(act1, 1, { at: t - 4.0, dur: 0.5, ease: ease.pulse });
  tl.tween(prog1, 1, { at: t - 3.4, dur: 2.0, ease: ease.move });
  tl.tween(res1, 1, { at: t - 1.2, dur: 0.5, ease: ease.pop });
  tl.tween(act1, 0, { at: t - 1.0, dur: 0.6, ease: ease.pulse });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 4.4, text: 'Failures come back too — tool_result with is_error: true.' });
  tl.tween(act2, 1, { at: t - 4.0, dur: 0.5, ease: ease.pulse });
  tl.tween(prog2, 0.62, { at: t - 3.4, dur: 1.4, ease: ease.move });
  tl.tween(res2, 1, { at: t - 1.6, dur: 0.5, ease: ease.pop });
  tl.tween(act2, 0, { at: t - 1.2, dur: 0.6, ease: ease.pulse });
  tl.hold(t, 1.1);

  return { tl, u1, u2, act1, prog1, res1, act2, prog2, res2 };
}

const demo = buildDemo();
demo.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/agent/tool-card.overrides.json', slug: 'agent-tool-card' };

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop motion={MOTION}>
        {(s) => (
          <>
            <ToolCard
              x={300}
              y={200}
              w={300}
              name="read_file"
              desc="Read a file from the workspace"
              schema={READ_SCHEMA}
              u={s.get(demo.u1)}
              active={s.get(demo.act1)}
              progress={s.get(demo.prog1)}
              result='"export function sample(t)…"'
              resultU={s.get(demo.res1)}
            />
            <ToolCard
              x={690}
              y={200}
              w={300}
              name="run_tests"
              desc="Run the test suite and report"
              schema={TEST_SCHEMA}
              u={s.get(demo.u2)}
              active={s.get(demo.act2)}
              progress={s.get(demo.prog2)}
              result="ENOENT: suite not found"
              resultKind="error"
              resultU={s.get(demo.res2)}
            />
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Agent/ToolCard',
  component: Demo,
};
export default meta;

export const DefineExecuteFail: StoryObj<typeof Demo> = {};
