import type { Meta, StoryObj } from '@storybook/react-vite';
import { GoodhartBenchmark } from './GoodhartBenchmark';

/**
 * Goodhart's Law on Benchmarks — 400 real gradient-ascent steps on a flawed
 * proxy: the benchmark climbs 0.13→2.69 while true quality peaks at 1.000
 * (step ~104) and collapses to 0.003.
 */
const meta: Meta<typeof GoodhartBenchmark> = {
  title: 'Explainers/Goodhart on Benchmarks',
  component: GoodhartBenchmark,
};
export default meta;

export const Explainer: StoryObj<typeof GoodhartBenchmark> = {};
