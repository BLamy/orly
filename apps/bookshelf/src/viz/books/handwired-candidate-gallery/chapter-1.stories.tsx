// Three Layouts — chapter 1 story. Scene authored by Claude Opus 5.5 (claude-opus-5-5).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Three Layouts at Once — the gallery's twelve photos laid out three ways side by side (Cinema, Contact,
 * Story), every rectangle a sum of the stage's width, height and gap; the stage is dragged down to a
 * 20 px sliver and relu pins the negative sizes at zero. Nothing is chosen yet.
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
  title: 'Books/Three Layouts/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
