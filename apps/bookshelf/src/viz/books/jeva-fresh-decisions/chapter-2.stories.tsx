// Jeva: Fresh Decisions — chapter 2 story. Scene authored by Claude Fable 5.1 (claude-fable-5-1).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * Which answer, or no answer? — a score ruler over a probability-mass ribbon: competition (q)
 * follows score differences, coverage (ρ) follows the strongest score against a learned
 * threshold, and the ribbon splits into candidate mass and null; then Noul and Score readouts.
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
  title: 'Books/Jeva: Fresh Decisions/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
