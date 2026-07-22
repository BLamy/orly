import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

const scene = vizScene();
function Chapter() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>{(s) => <Render s={s} />}</Player>
    </div>
  );
}

const meta: Meta<typeof Chapter> = {
  title: 'Books/Threads and Reactions/Chapter 2',
  component: Chapter,
};
export default meta;

export const C2: StoryObj<typeof Chapter> = { name: 'The Reply' };
