// Runtime Cost — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Real circuits, honest limits — the window manager's 130 real layer widths rise as a skyline, collapse into 130
 * layer tolls beside the probe's 16,384, then shrink into one row of a three-circuit timing chart on a log axis;
 * a harness caveat, a process check and the lab's status board follow, and the skyline closes as a recap tile.
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
  title: 'Books/Runtime Cost/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
