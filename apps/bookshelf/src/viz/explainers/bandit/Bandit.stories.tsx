import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bandit } from './Bandit';

/**
 * The Bandit — explore or exploit.
 * Three Bernoulli arms with hidden payout rates, and three REAL recorded runs:
 * greedy-only (the lock-on trap), epsilon-greedy, and UCB1 — with their true
 * cumulative pseudo-regret curves drawn from the simulations.
 */
const meta: Meta<typeof Bandit> = {
  title: 'Explainers/The Bandit',
  component: Bandit,
};
export default meta;

export const Explainer: StoryObj<typeof Bandit> = {};
