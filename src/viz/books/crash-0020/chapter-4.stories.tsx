import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

const scene = vizScene();

function Chapter4() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/crash-0020/Chapter 4',
  component: Chapter4,
};
export default meta;

export const AStampForEveryContext: StoryObj<typeof Chapter4> = {};
