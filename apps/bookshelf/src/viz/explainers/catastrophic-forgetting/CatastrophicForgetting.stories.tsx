import type { Meta, StoryObj } from '@storybook/react-vite';
import { CatastrophicForgetting } from './CatastrophicForgetting';

/**
 * Catastrophic Forgetting — a real 1-24-1 MLP trained on task A (loss
 * 0.0002), fine-tuned on B only (A loss climbs to 3.36), then re-run with
 * replay (A holds at 0.009). All curves recorded from actual training.
 */
const meta: Meta<typeof CatastrophicForgetting> = {
  title: 'Explainers/Catastrophic Forgetting',
  component: CatastrophicForgetting,
};
export default meta;

export const Explainer: StoryObj<typeof CatastrophicForgetting> = {};
