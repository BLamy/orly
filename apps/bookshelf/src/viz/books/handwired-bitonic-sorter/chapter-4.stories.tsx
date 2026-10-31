// Bitonic Sorter — chapter 4 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * What Handwired Pays — a compare-exchange drawn as three layers of weighted sums and relu folds into a tower of
 * layers; the tower and an operations bar then race ranks by counting at 16 and 64 items, the counting grid grows
 * as n², fp32 drift gets its caveat, and the verdict closes it.
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
  title: 'Books/Bitonic Sorter/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
