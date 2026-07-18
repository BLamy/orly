import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisionHierarchy } from './VisionHierarchy';

/**
 * Vision Hierarchy — a real 3-layer stack (Sobel pair → conjunction +
 * threshold → four-corner template) computed on a 14×14 hollow square;
 * the shape detector's center cell wins 1.00 vs 0.38.
 */
const meta: Meta<typeof VisionHierarchy> = {
  title: 'Explainers/Vision Hierarchy',
  component: VisionHierarchy,
};
export default meta;

export const Explainer: StoryObj<typeof VisionHierarchy> = {};
