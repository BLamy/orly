// Wolf, Dog, Model — chapter 1 story. Scene authored by claude-opus-5-5 (requested claude-opus-5-5). Silent scrub: no audio, no Motion save target.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/** The trait cloud as a model’s responses: wide pretraining, domestication by human feedback, breeding by verifiers, and the side effects. */
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
  title: 'Books/Wolf, Dog, Model/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
