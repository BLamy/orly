import type { Meta, StoryObj } from '@storybook/react-vite';
import { BatchNoise } from './BatchNoise';

/**
 * Batch Size and Noise — one tiny regression problem, honestly computed.
 * Sixty-four per-example gradients fan out at a probe point; averaging
 * collapses the fan at the measured σ/√B rate; three real SGD runs (batch
 * 1, 8, 64) race on the loss contours; then the cost twist — loss per
 * example seen — flips the standings.
 */
const meta: Meta<typeof BatchNoise> = {
  title: 'Explainers/Batch Size and Noise',
  component: BatchNoise,
};
export default meta;

export const Explainer: StoryObj<typeof BatchNoise> = {};
