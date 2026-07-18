import type { Meta, StoryObj } from '@storybook/react-vite';
import { PolicyGradient } from './PolicyGradient';

/**
 * Policy Gradients — nudging what worked.
 * A real REINFORCE run on a 5×5 gridworld: a softmax policy per square,
 * 80 iterations of 16 sampled episodes (seeded), the true log-probability
 * gradient update, recorded policies, batches, and the success curve.
 */
const meta: Meta<typeof PolicyGradient> = {
  title: 'Explainers/Policy Gradients',
  component: PolicyGradient,
};
export default meta;

export const Explainer: StoryObj<typeof PolicyGradient> = {};
