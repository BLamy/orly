// Learned Program — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * What Integers Cannot Say — twelve integer-exact two-add programs meet the 39,605-case checker and four survive;
 * a float ladder shows why the grouping matters; the chips drop into the 48 × 75 loss table, which enumeration and a
 * coordinate-descent repair read, and whose cost every hard-loss route pays first; then the status, plainly.
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
  title: 'Books/Learned Program/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
