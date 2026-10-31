// Knuth-Plass — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Many At Once — a log-log crossover chart of the README's W = 32 medians: one paragraph sits on the round-trip
 * floor, the full kernel loses at 1,000 paragraphs, dense-rows with positions wins 2.3× and 4.0×, line costs
 * uploaded lose, and the crossover is a range that moves between Chrome sessions.
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
  title: 'Books/Knuth-Plass/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
