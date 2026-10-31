// Bitonic Sorter — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * The Staircase — one bitonic network grows from 8 to 64 wires beside a staircase of its stage counts
 * (1, 3, 6, 10, 15, 21); a stage is n/2 comparators, the log axis shows the gap, a 64-wire sweep fires 32 at once,
 * then +∞ padding, the article's off-by-one loop, and odd-even mergesort's 543 against 672.
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
  title: 'Books/Bitonic Sorter/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
