import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overfitting } from './Overfitting';

/**
 * Overfitting — memorizing vs learning.
 * Real least-squares polynomial fits (degree 1..11, normal equations solved
 * by Gaussian elimination) morph through underfit → sweet spot → a degree-11
 * interpolant that threads every training point, misses the held-out test
 * set, and produces the classic train/test U-curve.
 */
const meta: Meta<typeof Overfitting> = {
  title: 'Explainers/Overfitting',
  component: Overfitting,
};
export default meta;

export const Explainer: StoryObj<typeof Overfitting> = {};
