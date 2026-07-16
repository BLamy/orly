import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Duplicates: the signature says stop — a 3-page cycle traps the crawler in
 * orbit; the content signature (create_signature → crawled_similar) matches
 * against the crawled_links ledger and the link sinks down the frontier;
 * bulk address dedup runs as the RemoveDuplicateUrls MapReduce.
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
  title: 'Books/The Web Crawler/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
