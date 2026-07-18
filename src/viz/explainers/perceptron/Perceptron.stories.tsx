import type { Meta, StoryObj } from '@storybook/react-vite';
import { Perceptron } from './Perceptron';

/**
 * The Perceptron — a line that learns.
 * Two seeded Gaussian clusters, a deliberately wrong first line, and the real
 * perceptron update rule replayed from its recorded trajectory: eight
 * mistake-driven nudges of (w, b) until a full pass over the shuffled points
 * is clean.
 */
const meta: Meta<typeof Perceptron> = {
  title: 'Explainers/The Perceptron',
  component: Perceptron,
};
export default meta;

export const Explainer: StoryObj<typeof Perceptron> = {};
