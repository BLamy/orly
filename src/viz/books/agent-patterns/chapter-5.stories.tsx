import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-5';

/**
 * The map, and the crash test — the four pattern dioramas assemble onto the
 * 2×2 map cut by pattern-triggers.md's two questions (all at once vs one
 * after another; fixed vs decided by the input), trigger phrases file into
 * their quadrants, then a blackout kills every parent mid-flight — and the
 * wake replays each glowing stream tape until every machine resumes exactly
 * where it stopped.
 */
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
  title: 'Books/Agent Patterns/Chapter 5',
  component: Chapter5,
};
export default meta;

export const Scene: StoryObj<typeof Chapter5> = {};
