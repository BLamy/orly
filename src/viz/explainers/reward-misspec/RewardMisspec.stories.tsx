import type { Meta, StoryObj } from '@storybook/react-vite';
import { RewardMisspec } from './RewardMisspec';

/**
 * Reward Misspecification — an exactly-solved gridworld whose optimal policy
 * walks straight through a vase the reward never mentioned; a -3 patch makes
 * it detour, but the world has more vases than any reward can list.
 */
const meta: Meta<typeof RewardMisspec> = {
  title: 'Explainers/Reward Misspecification',
  component: RewardMisspec,
};
export default meta;

export const Explainer: StoryObj<typeof RewardMisspec> = {};
