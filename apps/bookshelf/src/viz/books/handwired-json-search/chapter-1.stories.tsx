// JSON Search — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * One Thread Per Document — a wall of the corpus's 100,000 documents, one cell each; document 0 unfolds into its
 * 512 code-point cells and its length, a read head runs the highlighter's 37-operation step across it, the loop's
 * 107 statements stand beside the 13,350 written out, and the wall lights in one pass: 2.2 ms against seconds on the CPU.
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
  title: 'Books/JSON Search/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
