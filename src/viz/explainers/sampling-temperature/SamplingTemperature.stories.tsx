import type { Meta, StoryObj } from '@storybook/react-vite';
import { SamplingTemperature } from './SamplingTemperature';

/**
 * Sampling — temperature, and choosing the next word.
 * One bar chart of real softmax distributions morphs through cold and hot
 * temperatures; ten seeded draws land as tallies; greedy and sampled paths
 * diverge; top-k chops the tail and renormalizes the survivors.
 */
const meta: Meta<typeof SamplingTemperature> = {
  title: 'Explainers/Sampling',
  component: SamplingTemperature,
};
export default meta;

export const Explainer: StoryObj<typeof SamplingTemperature> = {};
