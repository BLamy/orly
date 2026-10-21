// Bitonic Sorter — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Building the Mountains — eight discs ride an 8-wire bitonic network through its six stages: pairs set to climb
 * or fall, two mountains of four, one mountain of eight, the half-cleaner, sorted; then the work count, the
 * distance ribbon, a second input on the same wiring, and the zero-one and random checks.
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
  title: 'Books/Bitonic Sorter/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
