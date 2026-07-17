import type { Meta, StoryObj } from '@storybook/react-vite';
import { InferenceCompression } from './InferenceCompression';

/**
 * Serve-Time Compression — Explained: Inference, chapter 5.
 * A real block-64 int4 quantizer draws its own staircase (10.8% measured
 * relative RMS error) and the bandwidth ladder: 143 / 286 / 571 / 667 tok/s.
 */
const meta: Meta<typeof InferenceCompression> = {
  title: 'Explainers/Inference Compression',
  component: InferenceCompression,
};
export default meta;
export const Explainer: StoryObj<typeof InferenceCompression> = {};
