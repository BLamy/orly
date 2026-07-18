import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProbGp } from './ProbGp';

/**
 * Gaussian Process — real RBF prior samples (Cholesky on an 80-point
 * grid), six observations, and the exact closed-form posterior mean, band,
 * and samples. Band width: ~0.07 at data, ~0.78 mid-gap.
 */
const meta: Meta<typeof ProbGp> = {
  title: 'Explainers/Gaussian Process',
  component: ProbGp,
};
export default meta;

export const Explainer: StoryObj<typeof ProbGp> = {};
