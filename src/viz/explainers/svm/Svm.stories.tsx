import type { Meta, StoryObj } from '@storybook/react-vite';
import { Svm } from './Svm';

/**
 * Support Vector Machines — the widest street.
 * The exactly-solved max-margin street (width 1.272, three support vectors)
 * on 20 seeded points, the delete-a-point invariance test, and the real
 * quadratic-kernel machine lifting XOR to a curved boundary.
 */
const meta: Meta<typeof Svm> = {
  title: 'Explainers/Support Vector Machines',
  component: Svm,
};
export default meta;

export const Explainer: StoryObj<typeof Svm> = {};
