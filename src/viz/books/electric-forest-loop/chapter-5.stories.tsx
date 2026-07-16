import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/** Why the Critic Beats a Reviewer — split stage: diff-reader vs the six-armed critic. */
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
  title: 'Books/The Electric Forest Loop/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
