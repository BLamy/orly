import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-6';

function Chapter6() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter6> = {
  title: 'Books/Durable Objects, Unbound/Chapter 6',
  component: Chapter6,
};
export default meta;

export const Scene: StoryObj<typeof Chapter6> = {};
