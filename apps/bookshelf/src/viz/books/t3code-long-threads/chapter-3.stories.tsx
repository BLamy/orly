import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

const scene = vizScene();

function Chapter3() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter3> = {
  title: 'Books/T3 Code: Long Threads/Chapter 3',
  component: Chapter3,
};
export default meta;

export const MountingOnlyWhatYouCanSee: StoryObj<typeof Chapter3> = {};
