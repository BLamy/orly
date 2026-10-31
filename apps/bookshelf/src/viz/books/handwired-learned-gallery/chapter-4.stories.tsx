// Learned Gallery — chapter 4 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/**
 * What held, what didn't — the probe's 960 edits light as each penalty form leaves them stuck, a ledger
 * zooms in on the kept form and the shipped numbers, the cells reflow into 200 Story variants, twelve drift
 * off with an edge on no line, and a status board ends on what is still open.
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
  title: 'Books/Learned Gallery/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
