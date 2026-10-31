// JSON Search — chapter 4 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * Who Does It Beat — one log-time axis for 100,000 documents: the GPU's bands, then each opponent's bar (the CPU,
 * RegExp, the backtracker, workers, the highlighter from the texts) with a verdict stamp, a crossover panel, the
 * review's corrections, the status ladder and the lab's own honesty rule.
 */
function Chapter4() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/JSON Search/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
