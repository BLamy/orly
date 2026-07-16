import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActivationFunctions } from './ActivationFunctions';

/**
 * Activation Functions — why depth needs bends.
 * Two linear layers collapse to a single line; the rectified linear unit adds
 * a hinge; a real 1-16-1 relu network (trained at module scope with full-batch
 * gradient descent) morphs through its actual training snapshots to fit a
 * sin-like target, with the real loss curve in an inset.
 */
const meta: Meta<typeof ActivationFunctions> = {
  title: 'Explainers/Activation Functions',
  component: ActivationFunctions,
};
export default meta;

export const Explainer: StoryObj<typeof ActivationFunctions> = {};
