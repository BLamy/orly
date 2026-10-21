// Reusable Layout — chapter 2 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/**
 * A Teacher That Searches — the authored objective built term by term on the six-card scene, then the
 * per-layout search re-run for the wide card: ten widths twice, steps of 16 down to 1, settling at 290 px
 * after 181 evaluations; then the 576-example training set, Adam over 121 parameters, and the held-out test.
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
  title: 'Books/Reusable Layout/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
