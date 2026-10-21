// Trace Compiler — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Source Becomes Wires — a walker reads the frozen gallery source as a syntax tree: constants fold into a
 * tray (one f32 reciprocal), the width becomes a wire through roundAffine and multiplyConstant, a ternary
 * becomes two masked products (against the older form's NaN), a bounded loop unrolls under mask bits,
 * and the whole circuit reads as weighted sums and relu inside a small, fenced subset.
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
  title: 'Books/Trace Compiler/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
