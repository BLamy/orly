import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

const scene = vizScene();

function Chapter5() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter5> = {
  title: 'Books/Replay QA/Chapter 5',
  component: Chapter5,
};
export default meta;

export const AFindingYouCanInterrogate: StoryObj<typeof Chapter5> = {};
