import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelfTrainingLoop } from './SelfTrainingLoop';

/**
 * Training on Yourself — the self-improvement ring with the smallest real
 * model: one lap (50 genuine samples, refit) already narrows the spread to
 * 0.89 and loses the tails entirely.
 */
const meta: Meta<typeof SelfTrainingLoop> = {
  title: 'Explainers/Self-Training Loop',
  component: SelfTrainingLoop,
};
export default meta;

export const Explainer: StoryObj<typeof SelfTrainingLoop> = {};
