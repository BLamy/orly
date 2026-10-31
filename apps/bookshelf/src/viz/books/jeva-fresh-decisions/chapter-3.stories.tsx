// Jeva: Fresh Decisions — chapter 3 story. Scene authored by Claude Fable 5.1 (claude-fable-5-1).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Reuse the options, decide again — the memory loom: option texts compress into persistent
 * u / K / V tiles in an atomic bank, ordered tuples gather those tiles into a matrix, and a fresh
 * request state crosses the assembled rows for a new decision (ABC → ABC → BCD → DAB).
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
  title: 'Books/Jeva: Fresh Decisions/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
