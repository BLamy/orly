import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProbMcmc } from './ProbMcmc';

/**
 * MCMC — a real 6,000-step Metropolis chain on a banana posterior
 * (44% acceptance, burn-in visible, histogram matching the true marginal).
 */
const meta: Meta<typeof ProbMcmc> = {
  title: 'Explainers/MCMC',
  component: ProbMcmc,
};
export default meta;

export const Explainer: StoryObj<typeof ProbMcmc> = {};
