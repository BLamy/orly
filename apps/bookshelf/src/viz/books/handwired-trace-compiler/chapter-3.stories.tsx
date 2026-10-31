// Trace Compiler — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Five Calculations — one trial runs through five lanes (reference evaluator, compiled execution, FP32 interpreter,
 * float64 interpreter, native JS); two brackets demand agreement, the report's counters land at zero mismatches,
 * a 4,097-notch ruler marks the six widths where FP32 and native choose different column counts, and a regression
 * shows the native check catching what the circuit lanes cannot.
 */
function Chapter3() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter3> = {
  title: 'Books/Trace Compiler/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
