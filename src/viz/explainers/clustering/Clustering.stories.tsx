import type { Meta, StoryObj } from '@storybook/react-vite';
import { Clustering } from './Clustering';

/**
 * Clustering — structure without labels.
 * A real recorded k-means run (bad init, 5 iterations, inertia 707 → 35),
 * the size-mismatch failure stealing 9 points, and an EM-fit Gaussian
 * mixture whose learned spreads put all 100 points right.
 */
const meta: Meta<typeof Clustering> = {
  title: 'Explainers/Clustering',
  component: Clustering,
};
export default meta;

export const Explainer: StoryObj<typeof Clustering> = {};
