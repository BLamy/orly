import type { Meta, StoryObj } from '@storybook/react-vite';
import { BenchmarkLifespan } from './BenchmarkLifespan';

/**
 * The Lifespan of a Benchmark — GLUE, SuperGLUE, MMLU and GSM8K's reported
 * frontier curves, replotted: every instrument saturates and goes silent.
 */
const meta: Meta<typeof BenchmarkLifespan> = {
  title: 'Explainers/Benchmark Lifespan',
  component: BenchmarkLifespan,
};
export default meta;

export const Explainer: StoryObj<typeof BenchmarkLifespan> = {};
