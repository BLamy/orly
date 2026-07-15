import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

const scene = vizScene();

function Chapter1() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter1> = {
  title: 'Books/Replay QA/Chapter 1',
  component: Chapter1,
};
export default meta;

export const TheClaimProblem: StoryObj<typeof Chapter1> = {};
