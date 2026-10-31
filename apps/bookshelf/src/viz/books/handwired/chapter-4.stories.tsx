// Handwired — chapter 4 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * Loops That Cannot Stop — a findIndex cursor stops early while the program tests every row at
 * once; the same row list becomes a count, a chain then a tree, a rank matrix and a table read,
 * while a log–log scatter of operations against layers records each trade.
 */
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
  title: 'Books/Handwired/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
