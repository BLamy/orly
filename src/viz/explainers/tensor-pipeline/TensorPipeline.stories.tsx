import type { Meta, StoryObj } from '@storybook/react-vite';
import { TensorPipeline } from './TensorPipeline';

/**
 * Cutting the Model — a real column-split matmul (asserted equal to the full
 * product) and computed pipeline-bubble schedules: 75% idle at m=1, 27.3% at
 * m=8, 8.8% at m=32.
 */
const meta: Meta<typeof TensorPipeline> = {
  title: 'Explainers/Tensor + Pipeline',
  component: TensorPipeline,
};
export default meta;

export const Explainer: StoryObj<typeof TensorPipeline> = {};
