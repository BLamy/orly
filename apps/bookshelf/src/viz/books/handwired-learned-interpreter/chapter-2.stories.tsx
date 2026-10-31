// Learned Program — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Cooling the Reels — the 48 × 75 loss table fills, two reels of probabilities cool across five temperatures,
 * and the same seed splits into the original and corrected Adam epsilon: one locks onto the wrong card, one escapes.
 */
function Chapter2() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter2> = {
  title: 'Books/Learned Program/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
