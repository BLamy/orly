// User Effort — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Fitting It, Then Testing It — 720 noisy durations, a prediction that starts flat on zero and rises into the cloud
 * as full-batch Adam turns five coefficients over 800 steps; the log–log loss collapses, the learned coefficients
 * land within 0.0099 of the authored ones, and a held-out error ladder sits 1.68 ms off the formula and on the
 * 20.21 ms noise floor against noisy data.
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
  title: 'Books/User Effort/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
