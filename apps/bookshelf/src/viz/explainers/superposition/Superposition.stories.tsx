import type { Meta, StoryObj } from '@storybook/react-vite';
import { Superposition } from './Superposition';

/**
 * Superposition — more features than neurons.
 * Two real training runs of the toy superposition model: dense features get
 * dedicated orthogonal dimensions (three deleted), sparse features pack into
 * a pentagon in two neurons, interference measured on screen.
 */
const meta: Meta<typeof Superposition> = {
  title: 'Explainers/Superposition',
  component: Superposition,
};
export default meta;

export const Explainer: StoryObj<typeof Superposition> = {};
