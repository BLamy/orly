import type { Meta, StoryObj } from '@storybook/react-vite';
import { CosineSimilarity } from './CosineSimilarity';

/**
 * Cosine Similarity — real vectors where the raw dot product ranks a long
 * off-angle document 3.7× higher, and normalization flips the order
 * (cos 0.995 vs 0.916).
 */
const meta: Meta<typeof CosineSimilarity> = {
  title: 'Explainers/Cosine Similarity',
  component: CosineSimilarity,
};
export default meta;

export const Explainer: StoryObj<typeof CosineSimilarity> = {};
