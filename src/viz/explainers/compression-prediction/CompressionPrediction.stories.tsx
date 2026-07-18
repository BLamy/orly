import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompressionPrediction } from './CompressionPrediction';

/**
 * Compression is Prediction — the bridge chapter.
 * A 50-character tape whose per-character bars are the real coding costs
 * under a uniform, unigram, then bigram model: 190 → 163 → 120 bits.
 */
const meta: Meta<typeof CompressionPrediction> = {
  title: 'Explainers/Compression is Prediction',
  component: CompressionPrediction,
};
export default meta;

export const Explainer: StoryObj<typeof CompressionPrediction> = {};
