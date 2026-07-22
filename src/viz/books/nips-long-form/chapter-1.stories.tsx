import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

function Chapter() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={vizScene().tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter> = {
  title: 'Books/Long Form/Chapter 1',
  component: Chapter,
};
export default meta;

export const Play: StoryObj<typeof Chapter> = {};
