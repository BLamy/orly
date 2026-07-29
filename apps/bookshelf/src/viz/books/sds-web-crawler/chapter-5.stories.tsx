import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/**
 * The Index: where search fits — each crawled page feeds the reverse index
 * queue and the document queue; a word×page matrix fills; the "hello world"
 * query rides Client → Web Server → Query API, term rows intersect, titles
 * and snippets attach, the memory cache short-circuits repeats; then the
 * whole book recaps on one quiet journey strip.
 */
function Chapter5() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter5> = {
  title: 'Books/The Web Crawler/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
