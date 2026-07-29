import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease } from '../core';
import type { TimelineOverrides } from '../core';
import { EventLane } from './event-lane';
import type { LaneEvent } from './event-lane';
import { ContextBar } from './context-bar';
import overrides from './event-lane.overrides.json';

/**
 * Events are the contract: one turn's provider-neutral events (tau's
 * vocabulary — AgentStart, MessageDelta, ToolExecution*, AgentEnd) travel
 * the lane from the loop to a frontend, while the context window fills
 * below — then compaction squeezes history into a summary.
 */
const EVENTS: LaneEvent[] = [
  { label: 'AgentStart', kind: 'lifecycle', at: 0.0 },
  { label: 'MessageStart', kind: 'message', at: 0.07 },
  { label: 'MessageDelta', kind: 'message', at: 0.12 },
  { label: 'MessageDelta', kind: 'message', at: 0.16 },
  { label: 'ThinkingDelta', kind: 'thinking', at: 0.21 },
  { label: 'ToolExecutionStart', kind: 'tool', at: 0.28 },
  { label: 'ToolExecutionUpdate', kind: 'tool', at: 0.36 },
  { label: 'ToolExecutionEnd', kind: 'tool', at: 0.44 },
  { label: 'MessageDelta', kind: 'message', at: 0.52 },
  { label: 'MessageEnd', kind: 'message', at: 0.58 },
  { label: 'AgentEnd', kind: 'lifecycle', at: 0.66 },
];

const CAPACITY = 200_000;

function buildDemo() {
  const tl = new Timeline();
  const laneR = tl.channel('laneReveal', 0);
  const laneU = tl.channel('laneU', 0);
  const barR = tl.channel('barReveal', 0);
  const sys = tl.channel('ctxSystem', 0);
  const msg = tl.channel('ctxMessages', 0);
  const tool = tl.channel('ctxToolResults', 0);
  const summary = tl.channel('ctxSummary', 0);
  const warn = tl.channel('warn', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 4.2, text: 'Events are the contract — frontends never see raw provider chunks.' });
  tl.tween(laneR, 1, { at: t - 3.8, dur: 1.0, ease: ease.draw });
  tl.tween(barR, 1, { at: t - 3.2, dur: 0.9, ease: ease.draw });
  tl.tween(sys, 22_000, { at: t - 3.0, dur: 0.8, ease: ease.move });

  t = tl.caption({ at: t, dur: 7.6, text: 'One turn on the wire: lifecycle, deltas, tool execution, end.' });
  tl.tween(laneU, 1, { at: t - 7.4, dur: 7.2, ease: ease.linear });
  tl.tween(msg, 96_000, { at: t - 7.0, dur: 6.0, ease: ease.linear });
  tl.tween(tool, 58_000, { at: t - 4.6, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 3.4, text: 'The context window is a budget — and this one is nearly spent.' });
  tl.tween(warn, 1, { at: t - 3.0, dur: 0.5, ease: ease.pulse });
  tl.tween(warn, 0.35, { at: t - 2.4, dur: 0.5, ease: ease.pulse });
  tl.tween(warn, 1, { at: t - 1.8, dur: 0.5, ease: ease.pulse });
  t = tl.hold(t, 0.3);

  t = tl.caption({ at: t, dur: 4.2, text: 'Compaction: old turns squeeze into a summary; the budget breathes.' });
  tl.tween(msg, 9_000, { at: t - 3.8, dur: 1.6, ease: ease.move });
  tl.tween(tool, 4_000, { at: t - 3.8, dur: 1.6, ease: ease.move });
  tl.tween(summary, 14_000, { at: t - 3.4, dur: 1.6, ease: ease.move });
  tl.tween(warn, 0, { at: t - 2.4, dur: 0.8, ease: ease.move });
  tl.hold(t, 1.2);

  return { tl, laneR, laneU, barR, sys, msg, tool, summary, warn };
}

const demo = buildDemo();
demo.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/agent/event-lane.overrides.json', slug: 'agent-event-lane' };

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop motion={MOTION}>
        {(s) => (
          <>
            <EventLane
              x1={180}
              y1={230}
              x2={1100}
              y2={230}
              u={s.get(demo.laneU)}
              events={EVENTS}
              travel={0.3}
              reveal={s.get(demo.laneR)}
              fromLabel="agent loop"
              toLabel="frontend"
            />
            <ContextBar
              x={180}
              y={430}
              w={920}
              capacity={CAPACITY}
              reveal={s.get(demo.barR)}
              warn={s.get(demo.warn)}
              segments={[
                { label: 'system', value: s.get(demo.sys), color: colors.MUTED },
                { label: 'summary', value: s.get(demo.summary), color: colors.TEAL },
                { label: 'messages', value: s.get(demo.msg), color: colors.ACCENT },
                { label: 'tool_results', value: s.get(demo.tool), color: colors.WARM },
              ]}
            />
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Agent/EventLane & ContextBar',
  component: Demo,
};
export default meta;

export const EventsAndCompaction: StoryObj<typeof Demo> = {};
