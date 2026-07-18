import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisionKernels } from './VisionKernels';

/**
 * Vision Kernels — a real 12×12 image convolved with a real 3-kernel bank
 * (Sobel vertical/horizontal + a checker-texture kernel); the checkerboard's
 * exact-zero Sobel response is a computed fact of the module.
 */
const meta: Meta<typeof VisionKernels> = {
  title: 'Explainers/Vision Kernels',
  component: VisionKernels,
};
export default meta;

export const Explainer: StoryObj<typeof VisionKernels> = {};
