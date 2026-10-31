// JSON Search — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Packing the Bits — the 32-state shader's 4,648 f32 statements, the identity relu(a − b) = a & (b ^ 1u), a row of
 * 32 states folding into one u32 word, and the bar race from 945 ms to 5.24 ms with no change to the program.
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
  title: 'Books/JSON Search/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
