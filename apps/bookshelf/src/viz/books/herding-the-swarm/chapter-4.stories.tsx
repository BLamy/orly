// Herding the Swarm — chapter 4 story. Scene authored by claude-opus-5-5 (requested claude-opus-5-5). Silent scrub: no audio, no Motion save target.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-4';

/** A comb of bees becomes a grid of identical agents: Hamilton's rule with r at one, then the effective number of independent checks when checks are correlated. */
function Chapter4() {
  const scene = vizScene();
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop>
        {(s) => <Render s={s} />}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Chapter4> = {
  title: 'Books/Herding the Swarm/Chapter 4',
  component: Chapter4,
};
export default meta;

export const Scene: StoryObj<typeof Chapter4> = {};
