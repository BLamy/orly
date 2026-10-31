// Generative Fields — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Scored, Searched, Climbed — the circuit's two self-grading outputs on one card, four thousand seeded samples as a
 * dot field whose valid dots fly onto a fitness axis, then twelve gradient climbs up that same axis past search's
 * 0.875, and the six-slot layout the best climb settles for.
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
  title: 'Books/Generative Fields/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
