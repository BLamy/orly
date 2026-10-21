// Event Window — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Latches, Not History — a 1280×800 stage of four windows beside the circuit's latch bank: a press writes the
 * record, a four-pixel crossing flips the drag-begin latch, only a release commits, focus moves on down, maximized
 * flips by arithmetic, and the boundary probe shows no fixed window of raw inputs can stand in for the latches.
 */
function Chapter1() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter1> = {
  title: 'Books/Event Window/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
