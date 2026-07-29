import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisionOcclusion } from './VisionOcclusion';

/**
 * Vision Occlusion — the square-detector stack really re-run 36 times with
 * a sliding gray occluder; every outline cut costs exactly 0.25, the
 * interior costs 0.00, and no single patch drops the score below 0.75.
 */
const meta: Meta<typeof VisionOcclusion> = {
  title: 'Explainers/Vision Occlusion',
  component: VisionOcclusion,
};
export default meta;

export const Explainer: StoryObj<typeof VisionOcclusion> = {};
