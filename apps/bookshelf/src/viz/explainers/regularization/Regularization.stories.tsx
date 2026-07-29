import type { Meta, StoryObj } from '@storybook/react-vite';
import { Regularization } from './Regularization';

/**
 * Regularization — the price of complexity.
 * A degree-10 polynomial fitted by real ridge regression across a log-spaced
 * λ sweep (normal equations solved by hand): the wild unpenalized fit smooths
 * out while its coefficient bars shrink in lockstep, the test-error U-curve
 * pins the sweet spot, and a dropout-style ensemble of 8 masked sub-fits
 * averages into a curve that hugs the truth.
 */
const meta: Meta<typeof Regularization> = {
  title: 'Explainers/Regularization',
  component: Regularization,
};
export default meta;

export const Explainer: StoryObj<typeof Regularization> = {};
