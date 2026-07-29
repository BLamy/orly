import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hnsw } from './Hnsw';

/**
 * HNSW — a real 60-point, 3-layer index (60/18/7) with a really-run greedy
 * descent that finds the true nearest neighbor in 21 distance computations
 * instead of 60.
 */
const meta: Meta<typeof Hnsw> = {
  title: 'Explainers/HNSW',
  component: Hnsw,
};
export default meta;

export const Explainer: StoryObj<typeof Hnsw> = {};
