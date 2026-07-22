import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

function Chapter2() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={vizScene().tl} loop>{(s) => <Render s={s} />}</Player>
    </div>
  );
}

const meta: Meta<typeof Chapter2> = {
  title: 'Books/The Relay/Chapter 2',
  component: Chapter2,
};
export default meta;

export const C: StoryObj<typeof Chapter2> = { name: 'Prove It Is You' };
