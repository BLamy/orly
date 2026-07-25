import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * PaW — three knobs on one co-training recipe: an entropy filter keeps only
 * the top seventy-five percent most uncertain actions for the world-modeling
 * loss, a clipped loss curve tames memorization and rare-token blow-ups past
 * a point-two confidence threshold, and a per-rollout-group dial swings
 * between trusting the reward and trusting the world model.
 */
function Chapter4() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/Agentic World Models/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
