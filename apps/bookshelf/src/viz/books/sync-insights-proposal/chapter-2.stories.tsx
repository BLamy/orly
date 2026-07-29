import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Sync Engines Are Dataflow Graphs — one diff walks an operator pipeline
 * that relabels itself Zero → Electric, a (data, time, ±1) chip and a
 * frontier sweep tie it to differential dataflow, and rungs line the graph
 * up with React's dispatch→render pipeline.
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
  title: 'Books/Sync Engine Insights/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
