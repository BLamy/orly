// Learned Gallery — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Photos from a sketch — Story's ten dashed rectangles on a 5 × 4 stage; twenty slot positions run through ten
 * features, two layers of six ReGLU units and four weighted sums into rectangles; the 244 weights as source cells;
 * then a real first fit: the seeded pile slides onto the sketch, matched and scored edge by edge.
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
  title: 'Books/Learned Gallery/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
