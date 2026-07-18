import type { Meta, StoryObj } from '@storybook/react-vite';
import { LstmGates } from './LstmGates';

/**
 * LSTM Gates — the real LSTM recurrence run on a marker-then-noise task:
 * the gated cell holds 0.95 after 17 noisy steps while a plain tanh RNN on
 * the same sequence decays to -0.10.
 */
const meta: Meta<typeof LstmGates> = {
  title: 'Explainers/LSTM Gates',
  component: LstmGates,
};
export default meta;

export const Explainer: StoryObj<typeof LstmGates> = {};
