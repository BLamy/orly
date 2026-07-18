import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvalVariance } from './EvalVariance';

/**
 * Variance and Significance — 2000 seeded reruns of a 100-question benchmark
 * for true skills 70% vs 71%: the better model loses 47% of reruns until
 * n = 10,000 shrinks σ from 4.6 to 0.46 points.
 */
const meta: Meta<typeof EvalVariance> = {
  title: 'Explainers/Eval Variance',
  component: EvalVariance,
};
export default meta;

export const Explainer: StoryObj<typeof EvalVariance> = {};
