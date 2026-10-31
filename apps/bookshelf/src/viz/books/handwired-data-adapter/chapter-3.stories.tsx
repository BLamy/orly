// Data Adapter — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * What the Check Shows — a ledger wall of the 438 held-out scenes (216 generated, 216 reversed twins, 6 boundary
 * cases) is swept by the eight programs for 14,016 comparisons, lends its boundary tiles to a float ruler, whispers
 * behind the reuse diagram and the limits, then regroups under the status stamp beside the open, unrun comparison.
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
  title: 'Books/Data Adapter/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
