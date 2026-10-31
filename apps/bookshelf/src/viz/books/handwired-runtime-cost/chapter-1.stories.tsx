// Runtime Cost — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Three ways to run one circuit — the window manager's program feeds three lanes whose memory is drawn to scale:
 * the reference's fresh array, the full-array executor's fresh workspace and scatter, and the reusable evaluator's
 * kept workspace and 727 outputs; then the shared range check, the harness, and the one-run timing race.
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
  title: 'Books/Runtime Cost/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
