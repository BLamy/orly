// Handwired — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * A Switch of Arithmetic — the toggle's 20-cell table as a wire tape: four comparisons, an and
 * as relu, two selects, and the spring as a matrix power the host writes into four cells.
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
  title: 'Books/Handwired/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
