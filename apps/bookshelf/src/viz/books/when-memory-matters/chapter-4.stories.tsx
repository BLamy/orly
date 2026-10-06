import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/** When Memory Matters — chapter 4 (silent; the book pipeline supplies narration). */
function Chapter4() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/When Memory Matters/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
