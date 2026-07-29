import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

function Chapter4() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={vizScene().tl} loop>{(s) => <Render s={s} />}</Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/The Relay/Chapter 4',
  component: Chapter4,
};
export default meta;

export const C: StoryObj<typeof Chapter4> = { name: 'Asking to Forget' };
