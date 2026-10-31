// Three Layouts — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Everyone Reads the Winner — a selector rack multiplies each layout's value by its one-hot bit and sums; the rack
 * replicates for every thumbnail and the hero, the stage drags between three presets, the sums lower to gather
 * reads, a click becomes twelve hit bits and a focus cell, and the 14 rounding points are counted.
 */
function Chapter3() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter3> = {
  title: 'Books/Three Layouts/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
