import type { Meta, StoryObj } from '@storybook/react-vite';
import { RewardHacking } from './RewardHacking';

/**
 * Reward Hacking — the letter, not the spirit.
 * A misspecified-reward gridworld solved exactly by value iteration: two
 * repeatable +1 coins out-value the +10 trophy under γ = 0.95, so the
 * provably optimal policy circles the coins forever. Nothing is staged.
 */
const meta: Meta<typeof RewardHacking> = {
  title: 'Explainers/Reward Hacking',
  component: RewardHacking,
};
export default meta;

export const Explainer: StoryObj<typeof RewardHacking> = {};
