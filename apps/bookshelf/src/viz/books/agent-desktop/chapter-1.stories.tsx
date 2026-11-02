import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * A desktop you can read — turn a live window into a scoped observation, choose an action, and read the
 * result again. Silent here: the book pipeline supplies the ElevenLabs voice at build time.
 */
const MOTION = { file: 'apps/bookshelf/src/viz/books/agent-desktop/chapter-1.overrides.json', slug: 'books/agent-desktop/chapter-1' };

function Chapter1() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter1> = {
  title: 'Books/Agent Desktop/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
