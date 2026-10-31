// Learned Gallery — chapter 3 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Taking steps back — a frame belt read through a gate: each frame's steps are a bet on one function, taken back
 * (weights and both moments restored, the rate halved) when it rises, kept (×1.15, ×2 below 1/64) when it falls;
 * a learning-rate ladder with its 1/64 → 1/4096 floor, the 2-or-none rule, the rest rule, and a 300-frame heat belt.
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
  title: 'Books/Learned Gallery/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
