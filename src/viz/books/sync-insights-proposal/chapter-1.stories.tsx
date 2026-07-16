import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * The Pattern You Already Built — the anatomy of ReactPerformanceInsights:
 * a recording strip of 120 commits (illustrative), one heavy dispatch exploding into 240
 * component dots and 90 selectors, and a finding card assembling itself
 * from the evidence, row by row.
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
  title: 'Books/Sync Engine Insights/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
