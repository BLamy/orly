import type { Meta, StoryObj } from '@storybook/react-vite';
import { Quantization } from './Quantization';

/**
 * Quantization — 256 real weights absmax-quantized to int8/int4 with the
 * actual error histograms (rmse 0.003 vs 0.056), plus the outlier that
 * quadruples everyone else's noise.
 */
const meta: Meta<typeof Quantization> = {
  title: 'Explainers/Quantization',
  component: Quantization,
};
export default meta;

export const Explainer: StoryObj<typeof Quantization> = {};
