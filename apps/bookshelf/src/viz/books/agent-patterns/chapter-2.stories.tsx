import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Map-Reduce: one worker per chunk — the input document shatters into eight
 * chunks, a burst spawns one worker each (spawnCounter ids, status
 * idle→mapping→reducing), wakes land out of order and sort themselves into a
 * numbered grid before the reduce sweep merges them into one result.
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
  title: 'Books/Agent Patterns/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
