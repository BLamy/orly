import type { Meta, StoryObj } from '@storybook/react-vite';
import { QLearning } from './QLearning';

/**
 * Q-Learning — learning from the next step.
 * A real tabular Q-learning run on the 6×6 gridworld (α 0.5, γ 0.9, ε 0.2,
 * seeded): episode one replayed step by step, max-Q heat growing backward
 * from the reward across 120 recorded episodes, and the learned greedy path.
 */
const meta: Meta<typeof QLearning> = {
  title: 'Explainers/Q-Learning',
  component: QLearning,
};
export default meta;

export const Explainer: StoryObj<typeof QLearning> = {};
