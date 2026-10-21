// UI Exploration — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * One Program, Many Photos — the 221-photo gallery: a copied circuit stacks up beside one per-photo program run
 * as instances; microsecond bars across 221, 1,000 and 10,000 photos; a spring step as a 2×2 matrix and its
 * power; values[index] as one operation; pointer jumping; and the 0.18 px band far down the gallery.
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
  title: 'Books/UI Exploration/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
