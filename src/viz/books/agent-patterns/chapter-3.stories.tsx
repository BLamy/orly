import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * Pipeline: one stage per wake — one payload of fourteen strokes stays center
 * stage and metamorphoses (raw → clean → analysis → report) while the status
 * state machine rail (idle → stage_1 → stage_2 → stage_3 → done) advances
 * exactly one stop per runFinished wake; the all-at-once ghost gets refused.
 */
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
  title: 'Books/Agent Patterns/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
