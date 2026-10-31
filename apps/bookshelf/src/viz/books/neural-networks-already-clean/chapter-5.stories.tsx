// Already Clean — chapter 5 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5) (requested claude-opus-5-5). Silent scrub: no audio, no Motion save target.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/** Two-ended pole tiles become an edge-matching grid: three records, a preliminary audit, then a constraint cascade whose fourth step stays dashed and empty. */
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
  title: 'Books/Already Clean/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
