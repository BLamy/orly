// Handwired — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Both Branches Run — the README's if-else taken apart on a number line: two relu ramps subtract
 * into a step, the step's bit picks ten or twelve while both are computed, then builder code, the
 * four operations and a stack of layers that cannot loop.
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
  title: 'Books/Handwired/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
