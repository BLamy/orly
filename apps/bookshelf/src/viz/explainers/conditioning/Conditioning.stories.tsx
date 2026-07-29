import type { Meta, StoryObj } from '@storybook/react-vite';
import { Conditioning } from './Conditioning';

/**
 * Ill-Conditioning — why stretched valleys break gradient descent.
 * One exact quadratic bowl (condition number 25), a learning-rate sweep with
 * closed-form iterates (crawl / optimal / honest divergence), the per-axis
 * safe windows that explain it, and momentum/Adam as the fixes.
 */
const meta: Meta<typeof Conditioning> = {
  title: 'Explainers/Ill-Conditioning',
  component: Conditioning,
};
export default meta;

export const Explainer: StoryObj<typeof Conditioning> = {};
