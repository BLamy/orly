// Trace Compiler — chapter 4 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * How Much Is Covered — a wall of 221 statement units fills: 64 verified, 49 candidates that don't count, the rest
 * named; the slices' cost and depth, the 1,580-layer photo chain, the two rejection probes, the status page, and
 * the route from source to five checks.
 */
function Chapter4() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/Trace Compiler/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
