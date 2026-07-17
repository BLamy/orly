import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisionPooling } from './VisionPooling';

/**
 * Vision Pooling — a real Sobel map max-pooled 2×2; the one-pixel shift
 * changes 10/100 feature-map cells and 0/25 pooled cells (computed at
 * module scope in scene.ts).
 */
const meta: Meta<typeof VisionPooling> = {
  title: 'Explainers/Vision Pooling',
  component: VisionPooling,
};
export default meta;

export const Explainer: StoryObj<typeof VisionPooling> = {};
