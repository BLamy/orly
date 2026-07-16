import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Durable Proxy — durable fetch relabels the request, the allowlist gates it,
 * the proxy mints a stream and forks the upstream body through a 4 KB / 50 ms
 * batching bucket onto the tape while the client reads the tape; the tab dies
 * mid-generation and resumes by requestId without the provider noticing.
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
  title: 'Books/Electric Internals/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
