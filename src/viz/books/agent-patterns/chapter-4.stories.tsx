import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * Dispatcher: classify and route — message cards ride the inbox rail into
 * the dispatcher, whose model picks a TYPE per request; the railroad switch
 * physically throws, specialists spawn on demand at track ends
 * (dispatchCounter ids), answers ride runFinished wakes home, and an
 * unregistered type bounces off the switch (validate or catch).
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
  title: 'Books/Agent Patterns/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
