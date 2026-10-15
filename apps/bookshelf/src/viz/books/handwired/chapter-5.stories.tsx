// Handwired — chapter 5 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/**
 * Exact, Trainable, Wide — the chapter-1 program stack read four ways: its comparison bits equal
 * JavaScript's, a gradient runs back through it and stops at a rounding bit unless straight-through
 * is chosen, its weights are frozen in the desktop demo and trained in the learned gallery, and one
 * pass runs it over 100,000 documents.
 */
function Chapter5() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter5> = {
  title: 'Books/Handwired/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
