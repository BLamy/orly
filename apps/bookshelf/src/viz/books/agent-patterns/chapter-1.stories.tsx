import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-1';

/**
 * Manager-Worker: the fan and the tape — a manager entity fans one question
 * out to the docs' fixed optimist/pessimist/pragmatist trio, stamps every
 * spawn onto its append-only stream, goes dark, and is relit one runFinished
 * wake at a time until the synthesis braids three answers into one.
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
  title: 'Books/Agent Patterns/Chapter 1',
  component: Chapter1,
};
export default meta;

export const Scene: StoryObj<typeof Chapter1> = {};
