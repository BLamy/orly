// Bitonic Sorter — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Two Wires and a Fold — one comparator on two flat wires, Batcher's 24-comparator network as a ghost, then the
 * wires stand up into the mountain [1, 2, 6, 7, 8, 5, 3, 0] and the half-cleaner folds it into a low and a high
 * half; distance 2 and 1 finish the merge.
 */
function Chapter1() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter1> = {
  title: 'Books/Bitonic Sorter/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
