import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

const scene = vizScene();
// Motion panel target: edits save into this overrides file (created on first save). Silent: the book pipeline narrates.
const MOTION = { file: 'apps/bookshelf/src/viz/books/agent-desktop/chapter-4.overrides.json', slug: 'books/agent-desktop/chapter-4' };

function Chapter() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter> = { title: 'Books/Agent Desktop/Chapter 4', component: Chapter };
export default meta;
export const KeepingIdentityAlive: StoryObj<typeof Chapter> = {};
