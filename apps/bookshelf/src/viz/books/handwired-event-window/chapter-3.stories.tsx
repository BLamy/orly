// Event Window — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Exact, Within Limits — a scorecard ledger fills one stamped row per claim while the frame tape beside it
 * becomes twelve seed strips, one 120,000-frame bar over the 30,000-frame trained bar, a linear cost chart,
 * the unread press archive, the six trained cells under an authored latch bank, a fixed demo bug and the
 * open cards, ending on a three-step recap.
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
  title: 'Books/Event Window/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
