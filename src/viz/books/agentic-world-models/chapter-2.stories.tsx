import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * The masking trick — an agent trajectory is one stream of tokens, some
 * generated as actions and some fed back as observations. A token-level
 * mask sends actions through GRPO's advantage-weighted policy loss and
 * observations through an ordinary supervised loss (SFT ≡ RL with a
 * constant positive advantage), and both rivers converge into one loss.
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
  title: 'Books/Agentic World Models/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
