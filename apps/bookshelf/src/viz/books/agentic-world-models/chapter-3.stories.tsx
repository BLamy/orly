import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '../../core';
import { Render, vizScene } from './chapter-3';

/**
 * The proof: terminals, code, and retrieval — ECHO doubles Terminal-Bench
 * 2.0 pass rate and reaches plain GRPO's ceiling in far fewer steps, then
 * the camera pulls the same trajectory strip back into a three-domain
 * comparison: a healthy terminal curve beside forth-lang and deepdive
 * curves that overfit once dense supervision goes too far.
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
  title: 'Books/Agentic World Models/Chapter 3',
  component: Chapter3,
};
export default meta;

export const Scene: StoryObj<typeof Chapter3> = {};
