// Generative Fields — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * The Path Between — one viewport and one ribbon of ticks: the hero migration stays valid for 21 frames, grid → list
 * breaks along 92 of its 101 points and joins the 60-path wall, projection repairs every point (one by hiding ten
 * slots), the audit splits the old validity bit into two reports, and repaired neighbours still jump.
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
  title: 'Books/Generative Fields/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
