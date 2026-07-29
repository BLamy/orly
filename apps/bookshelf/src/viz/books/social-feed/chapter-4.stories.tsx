import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * The Celebrity Problem — a highly-followed account against a 700-dot
 * follower murmuration: the fan-out crawls, a reply overtakes its original,
 * and the hybrid re-forms the crowd — celebrity tweets stay in one column and
 * a zipper merge interleaves them into the feed at serve time. Ends on the
 * series recap.
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
  title: 'Books/The Social Feed/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
