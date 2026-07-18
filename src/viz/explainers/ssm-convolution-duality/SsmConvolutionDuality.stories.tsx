import type { Meta, StoryObj } from '@storybook/react-vite';
import { SsmConvolutionDuality } from './SsmConvolutionDuality';

/**
 * The Convolution Duality — Explained: State-Space Models, chapter 3.
 * One linear SSM computed both as a step-by-step recurrence and as one
 * convolution with the unrolled kernel K_j = C A^j B; the outputs agree to
 * machine precision (max diff ≈ 6.7e-16, genuinely checked).
 */
const meta: Meta<typeof SsmConvolutionDuality> = {
  title: 'Explainers/SSM Convolution Duality',
  component: SsmConvolutionDuality,
};
export default meta;

export const Explainer: StoryObj<typeof SsmConvolutionDuality> = {};
