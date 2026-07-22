import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

function Chapter3() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={vizScene().tl} loop>{(s) => <Render s={s} />}</Player>
    </div>
  );
}

const meta: Meta<typeof Chapter3> = {
  title: 'Books/The Relay/Chapter 3',
  component: Chapter3,
};
export default meta;

export const C: StoryObj<typeof Chapter3> = { name: 'Ask Without Downloading' };
