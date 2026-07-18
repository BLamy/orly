import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaFastWeights } from './DeltaFastWeights';

/**
 * Fast Weights — Explained: The Delta Rule, chapter 1.
 * A d = 16 matrix as key-value memory: real outer-product writes and key
 * reads; measured crowding (avg recall 0.78 after 12 pairs).
 */
const meta: Meta<typeof DeltaFastWeights> = {
  title: 'Explainers/Delta Fast Weights',
  component: DeltaFastWeights,
};
export default meta;
export const Explainer: StoryObj<typeof DeltaFastWeights> = {};
