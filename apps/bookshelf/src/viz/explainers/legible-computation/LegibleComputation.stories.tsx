import type { Meta, StoryObj } from '@storybook/react-vite';
import { LegibleComputation } from './LegibleComputation';

/** arXiv:2607.03502 — Reading Between the Dots. */
const meta: Meta<typeof LegibleComputation> = {
  title: 'Explainers/Legible Computation',
  component: LegibleComputation,
};
export default meta;

export const Explainer: StoryObj<typeof LegibleComputation> = {};
