import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisionPatches } from './VisionPatches';

/**
 * Vision Patches — a real 12×12 image cut into nine tokens; the 9×9
 * attention matrix is a real softmax over mean-centered patch vectors
 * (checker twins and the edge pair each split 0.47/0.47).
 */
const meta: Meta<typeof VisionPatches> = {
  title: 'Explainers/Vision Patches',
  component: VisionPatches,
};
export default meta;

export const Explainer: StoryObj<typeof VisionPatches> = {};
