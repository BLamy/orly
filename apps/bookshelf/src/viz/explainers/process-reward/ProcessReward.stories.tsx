import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProcessReward } from './ProcessReward';

/**
 * Process vs Outcome — a real chain simulation where broken chains land the
 * right answer 20% of the time: outcome selection plateaus at ~70%, process
 * (min-over-steps) selection reaches 99.9% at N=128.
 */
const meta: Meta<typeof ProcessReward> = {
  title: 'Explainers/Process Reward',
  component: ProcessReward,
};
export default meta;

export const Explainer: StoryObj<typeof ProcessReward> = {};
