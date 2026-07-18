import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProbVi } from './ProbVi';

/**
 * Variational Inference — a diagonal Gaussian really optimized (60
 * finite-difference gradient steps on grid-quadrature KL) against a
 * two-mode posterior; committing scores 0.42 vs 1.86 for hedging.
 */
const meta: Meta<typeof ProbVi> = {
  title: 'Explainers/Variational Inference',
  component: ProbVi,
};
export default meta;

export const Explainer: StoryObj<typeof ProbVi> = {};
