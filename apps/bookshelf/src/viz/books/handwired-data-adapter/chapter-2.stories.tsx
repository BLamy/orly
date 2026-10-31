// Data Adapter — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * 868 Programs, Twelve Scenes — the whole search vocabulary laid out as one wall of 868 programs
 * (7 row-test subsets × 4 fields × 31 step sequences); twelve training scenes sweep it down to one
 * program per task, early rejection keeps it to 997 circuit runs, and both controls fit nothing.
 */
function Chapter2() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter2> = {
  title: 'Books/Data Adapter/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
