// Event Window — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * A Ramp That Narrows — the title and slop tests as one clamped ramp over a pixel axis; the six parameter cells train
 * on single frames while the ramp narrows 32 → 4 → 1 → 0.25 px; 20 of 20 scrambled starts land in band, while a ramp
 * held at 4 px drifts to 30.01 and diverges on 9,120 of 10,000 frames.
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
  title: 'Books/Event Window/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
