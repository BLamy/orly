import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * The sparse-reward problem — a long agent trajectory of action/observation
 * cards gets exactly one reward pulse at the final step under standard RL;
 * the same tape is then relit card by card as the paper's fix adds dense
 * supervised loss on every observation, morphing the training-signal curve
 * from a lone spike into a steady rhythm of bumps.
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
  title: 'Books/Agentic World Models/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
