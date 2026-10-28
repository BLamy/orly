// Wolf, Dog, Model — chapter 1 story. Scene authored by claude-opus-5-5 (requested claude-opus-5-5). Silent scrub: no audio, no Motion save target.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/** A trait-space cloud under two kinds of choosing: a breeder's target box, then the unplanned slide toward calm. */
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
  title: 'Books/Wolf, Dog, Model/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
