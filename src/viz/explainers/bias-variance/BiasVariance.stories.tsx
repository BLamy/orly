import type { Meta, StoryObj } from '@storybook/react-vite';
import { BiasVariance } from './BiasVariance';

/**
 * Bias and Variance — the decomposition.
 * Thirty seeded training sets from one truth; a stiff parabola and a flexible
 * degree-9 polynomial fit to each by real least squares. The flexible cloud
 * spreads wildly but its mean hugs the truth (variance); the stiff fits agree
 * but their mean misses the bends (bias). At a probe point, squared bias plus
 * variance plus noise equals the measured expected error to the third decimal.
 */
const meta: Meta<typeof BiasVariance> = {
  title: 'Explainers/Bias and Variance',
  component: BiasVariance,
};
export default meta;

export const Explainer: StoryObj<typeof BiasVariance> = {};
