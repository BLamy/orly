// Learned Gallery — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Lining up without snapping — a row of four photo tops on a ruler over the live pairPull curve: the
 * straightening that was dropped, the penalty's pull and reach, the slider, line counts, the multiplier that
 * closes the last sliver, the waiting penalty, the measured result, and the two layouts one sketch can end in.
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
  title: 'Books/Learned Gallery/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
