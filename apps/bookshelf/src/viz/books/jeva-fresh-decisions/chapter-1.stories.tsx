// Jeva: Fresh Decisions — chapter 1 story. Scene authored by Claude Fable 5.1 (claude-fable-5-1).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Fixed options, changing judgments — the paper's Proposition 1 compass: a request state is
 * nudged by a weighted sum over fixed option vectors; a third option flips the A/B winner,
 * and a row permutation leaves the refined state unchanged.
 */
function Chapter1() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter1> = {
  title: 'Books/Jeva: Fresh Decisions/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
