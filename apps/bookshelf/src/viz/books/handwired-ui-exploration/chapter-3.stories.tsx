// UI Exploration — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * What Held, What Narrowed — a dragged card edge, one backward pass and a solver step on the app shell; 3,000
 * scripted frames as a waffle (63.6% solved by one gradient step, 37.6% on the candidate gallery); the edge plotted
 * across decisions (a true slope, a jump, flat steps) and a 256-candidate search; then a ledger of stamped verdicts
 * and the status page's "record of that exploration".
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
  title: 'Books/UI Exploration/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
