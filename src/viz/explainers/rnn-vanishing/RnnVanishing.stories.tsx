import type { Meta, StoryObj } from '@storybook/react-vite';
import { RnnVanishing } from './RnnVanishing';

/**
 * RNNs and the Vanishing Gradient — a real 20-step tanh RNN whose exact
 * Jacobian products show the learning signal dying: ~0.008 twenty steps back
 * at w = 0.9, ~3e-9 at w = 1.6 (saturation).
 */
const meta: Meta<typeof RnnVanishing> = {
  title: 'Explainers/RNN Vanishing Gradient',
  component: RnnVanishing,
};
export default meta;

export const Explainer: StoryObj<typeof RnnVanishing> = {};
