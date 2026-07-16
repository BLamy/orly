import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

const scene = vizScene();

function Chapter2() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter2> = {
  title: 'Books/crash-0020/Chapter 2',
  component: Chapter2,
};
export default meta;

export const FourChecksNoCatch: StoryObj<typeof Chapter2> = {};
