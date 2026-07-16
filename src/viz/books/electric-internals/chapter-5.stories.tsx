import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/**
 * StreamFS and the stack — a filesystem grown from a /_metadata stream and
 * per-file /_content streams: the directory tree is a fold, a second agent
 * watches the same tape, a stale write bounces with PreconditionFailedError,
 * and the finale stacks all five layers into one tower on the tape.
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
  title: 'Books/Electric Internals/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
