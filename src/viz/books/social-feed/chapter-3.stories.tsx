import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * The Home-Timeline Cache — the naive fan-out-on-read spider jams red and is
 * swept off; the real path grabs the precomputed Redis list in O(1) and two
 * batched multigets hydrate a skeleton into a feed. Ends on the trim/rebuild
 * rules that keep the cache lean.
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
  title: 'Books/The Social Feed/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
