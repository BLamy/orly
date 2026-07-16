import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/**
 * Going Dark — Offline, reconnect, and the 409: the bookmark replays just the gap, and when the log itself is gone, must-refetch resets the state machine to offset minus one and spools a fresh tape.
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
  title: 'Books/Electric Sync/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
