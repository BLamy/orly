import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/**
 * Qwen-AgentWorld's twin world model: a separate network trained across
 * seven domains in three stages — non-thinking pretraining, reasoning-trace
 * SFT, and GSPO reinforcement learning against a nine-to-one rubric versus
 * executable-check reward — good enough to substitute for the real
 * environment during policy training (SimRL). Closes with a recap of the
 * whole book's arc.
 */
function Chapter5() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter5> = {
  title: 'Books/Agentic World Models/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
