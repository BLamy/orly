import type { Meta, StoryObj } from '@storybook/react-vite';
import { Knn } from './Knn';

/**
 * k-Nearest Neighbors — memory as a model.
 * The real kNN vote field morphing across k = 1, 7, 25 on 80 seeded points,
 * actual leave-one-out error per k, and the measured collapse of distance
 * contrast as dimensionality grows.
 */
const meta: Meta<typeof Knn> = {
  title: 'Explainers/k-Nearest Neighbors',
  component: Knn,
};
export default meta;

export const Explainer: StoryObj<typeof Knn> = {};
