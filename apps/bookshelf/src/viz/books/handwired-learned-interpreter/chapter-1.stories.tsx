// Learned Program — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * A Program in 123 Cells — example rows feed four registers; one candidate instruction becomes a fan of 48,
 * then 75; dials mix the cards' results into a soft sum and harden to one exact instruction; the 123 program
 * cells are counted, the two target programs and the checker run, and the measured circuit closes the chapter.
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
  title: 'Books/Learned Program/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
