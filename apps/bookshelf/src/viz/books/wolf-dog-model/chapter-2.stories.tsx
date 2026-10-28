// Wolf, Dog, Model — chapter 1 story. Scene authored by claude-opus-5-5 (requested claude-opus-5-5). Silent scrub: no audio, no Motion save target.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-2';

/** One fox silhouette morphing generation by generation under selection for tameness alone, then the contest over what it shows. */
function Chapter2() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter2> = {
  title: 'Books/Wolf, Dog, Model/Chapter 2',
  component: Chapter2,
};
export default meta;

export const Scene: StoryObj<typeof Chapter2> = {};
