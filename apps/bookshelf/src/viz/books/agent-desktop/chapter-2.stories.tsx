// Agent Desktop · Chapter 2 — "A ref is a claim" (Storybook story; silent — the book pipeline supplies the voice).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, buildScene, vizScene } from './chapter-2';

export { buildScene, Render, vizScene };

const scene = vizScene();
const MOTION = {
  file: 'apps/bookshelf/src/viz/books/agent-desktop/chapter-2.overrides.json',
  slug: 'books/agent-desktop/chapter-2',
};

function Chapter2() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter2> = {
  title: 'Books/Agent Desktop/Chapter 2',
  component: Chapter2,
  // the scene-module exports above are re-exported for the book contract, not as stories
  excludeStories: ['buildScene', 'Render', 'vizScene'],
};
export default meta;

export const ARefIsAClaim: StoryObj<typeof Chapter2> = {};
