// Agent Desktop — chapter 3: Before the action lands (Storybook harness; silent — the book pipeline adds voice).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, buildScene, vizScene } from './chapter-3';

export { Render, buildScene, vizScene };

const scene = vizScene();
const MOTION = { file: 'apps/bookshelf/src/viz/books/agent-desktop/chapter-3.overrides.json', slug: 'books/agent-desktop/chapter-3' };

function Chapter() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter> = {
  title: 'Books/Agent Desktop/Chapter 3',
  component: Chapter,
  excludeStories: ['Render', 'buildScene', 'vizScene'],
};
export default meta;

export const BeforeTheActionLands: StoryObj<typeof Chapter> = {};
