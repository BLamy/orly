// Reusable Layout — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * One Rule for Every Photo — a 900 px gallery of six photos feeds eight numbers per photo through one
 * 121-parameter circuit (96 products, 12 sums, 12 relu, one output sum, × 400); the six widths it proposes
 * are wrapped into rows by ordinary code, and storage order and ids change nothing.
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
  title: 'Books/Reusable Layout/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
