import type { Meta, StoryObj } from '@storybook/react-vite';
import { DensityEstimation } from './DensityEstimation';

/**
 * Density — what "learning a distribution" means.
 * 300 seeded points from a hidden Gaussian mixture, a real EM fit recorded
 * iteration by iteration, the true log-likelihood curve, and fresh samples
 * drawn from the fitted model.
 */
const meta: Meta<typeof DensityEstimation> = {
  title: 'Explainers/Density',
  component: DensityEstimation,
};
export default meta;

export const Explainer: StoryObj<typeof DensityEstimation> = {};
